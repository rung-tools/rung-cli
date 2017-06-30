import path from 'path';
import Zip from 'jszip';
import Promise, { all, promisifyAll, reject, resolve } from 'bluebird';
import {
    T,
    __,
    complement,
    concat,
    cond,
    contains,
    curry,
    drop,
    either,
    endsWith,
    equals,
    filter,
    head,
    identity,
    ifElse,
    isEmpty,
    join,
    lensProp,
    map,
    mapObjIndexed,
    merge,
    over,
    pipe,
    prop,
    propEq,
    sort,
    subtract,
    takeWhile,
    test,
    tryCatch,
    type,
    unary,
    union,
    without
} from 'ramda';
import deepmerge from 'deepmerge';
import { emitSuccess, emitWarning } from './input';
import { getProperties } from './vm';
import { fileMatching, findAndCompileModules, inspect } from './module';

const fs = promisifyAll(require('fs'));

const defaultFileOptions = { date: new Date(1149562800000) };
const requiredFiles = ['package.json', 'index.js'];

const localeByFile = pipe(
    drop(8),
    takeWhile(complement(equals('.'))),
    join('')
);

/**
 * Converts a list of locale files to pairs containing locale string and content
 *
 * @param {String[]} localeFiles
 * @return {Promise}
 */
function localesToPairs(localeFiles) {
    return all(localeFiles.map(localeFile => fs.readFileAsync(localeFile, 'utf-8')
        .then(JSON.parse)
        .then(json => [localeByFile(localeFile), json])));
}

/**
 * Projects locale for each translatable subfield
 *
 * @param {String} locale
 * @param {Object} config
 * @return {Object}
 */
const project = curry((locale, config) => ({
    title: { [locale]: config.title },
    description: { [locale]: config.description },
    preview: { [locale]: config.preview },
    params: mapObjIndexed(param => merge(param,
        { description: { [locale]: param.description } }), config.params)
}));

/**
 * Lazily runs the extension using all possible listed locales and extracts
 * the meta-data.
 *
 * @param {String} source
 * @param {[(String, *)]} locales
 * @return {Promise}
 */
const runInAllLocales = curry((source, locales) =>
    findAndCompileModules().then(modules =>
        all([['default', {}], ...locales].map(([locale, strings]) =>
            getProperties({ name: `precompile-${locale}`, source }, strings, modules)
                .then(project(locale))))
                .then(ifElse(propEq('length', 1), head, unary(deepmerge.all)))));

/**
 * Creates a meta file where the information about precompilation is stored
 *
 * @param {Object} locales
 * @return {Promise}
 */
function createMetaFile(locales) {
    return fs.writeFileAsync('.meta', JSON.stringify(locales));
}

/**
 * Precompiles the locale files, generating a meta file containing the meta
 *
 * @param {Object<String, String[]>} { code, files }
 * @return {Promise}
 */
function precompileLocales({ code, files }) {
    return resolve(files)
        .then(filter(test(/^locales(\/|\\)[a-z]{2,3}(_[A-Z]{2})?\.json$/)))
        .then(localesToPairs)
        .then(runInAllLocales(code))
        .then(createMetaFile)
        .thenReturn(['.meta', ...files]);
}

/**
 * Returns the full name for a file that may not contain an extension
 *
 * @param {String} partialName
 * @return {Promise}
 */
function getQualifiedName(partialName) {
    const getMatches = cond([
        [either(endsWith('.json'), endsWith('.js')), fileMatching],
        [T, pipe(concat(__, '.{js,json}'), fileMatching)]
    ]);

    return getMatches(partialName)
        .then(ifElse(
            isEmpty,
            () => reject(new Error(`Unable to resolve ${partialName}`)),
            head));
}

/**
 * Ensures there are missing no files in order to a allow a basic compilation
 * and filter the used modules. It also warns about possible improvements in the
 * extensions
 *
 * @param {String[]} files
 * @return {Promise}
 */
function filterFiles(files) {
    const missingFiles = without(files, requiredFiles);

    if (missingFiles.length > 0) {
        throw new Error(`missing ${missingFiles.join(', ')} from the project`);
    }

    if (!contains('icon.png', files)) {
        emitWarning('compiling extension without providing an icon.png file');
    }

    return fs.readFileAsync('index.js', 'utf-8')
        .then(inspect)
        .then(over(lensProp('modules'), filter(test(/\.\/.+/))))
        .then(({ code, modules }) =>
            all(modules.map(getQualifiedName))
                .map(unary(path.join))
                .then(union(files))
                .then(files => ({ code, files })));
}

/**
 * Filters true locale files and appends the full qualified name for the
 * previous files
 *
 * @param {Object<String, String[]>} { code, files }
 * @return {Promise}
 */
function appendLocales({ code, files }) {
    return fs.lstatAsync('locales')
        .then(lstat => lstat.isDirectory() ? fs.readdirAsync('locales') : [])
        .then(pipe(
            filter(test(/^[a-z]{2}(_[A-Z]{2,3})?\.json$/)),
            map(file => path.join('locales', file))))
        .filter(filePath => fs.readFileAsync(filePath)
            .then(pipe(JSON.parse, item => type(item) === 'Object'))
            .catchReturn(false))
        .then(pipe(union(files), sort(subtract), files => ({ code, files })))
        .catchReturn({ code, files });
}

/**
 * Opens package.json and extrats its contents. Returns a promise containing
 * the file list to be zipped and the package.json content parsed
 *
 * @param {String} dir
 * @return {Promise}
 */
function getProjectName(dir) {
    return fs.readFileAsync(path.join(dir, 'package.json'))
        .then(pipe(JSON.parse, prop('name')))
        .catchThrow(new Error('Failed to parse package.json from the project'));
}

/**
 * Generates a zip package using a node buffer containing the necessary files
 *
 * @param {String} dir
 * @param {String[]} files
 * @param {String} name
 */
const createZip = curry((dir, files) => {
    const zip = new Zip();
    files.forEach(filename => addToZip(zip, dir, filename));
    return zip;
});

/**
 * Taking account the -o parameter can be used to specify the output directory,
 * let's deal with it
 *
 * @param {String} customPath
 * @param {String} filename
 * @return {String}
 */
function resolveOutputTarget(customPath, filename) {
    const realPath = path.resolve('.', customPath);

    const getPath = tryCatch(realPath => fs.lstatSync(realPath).isDirectory()
        ? path.join(realPath, filename)
        : realPath
    , identity);

    return getPath(realPath);
}

/**
 * Saves the zip file from buffer to the filesystem
 *
 * @param {String} dir
 * @param {Zip} zip
 * @param {String} name
 */
const saveZip = curry((dir, zip, name) => {
    const target = resolveOutputTarget(dir, `${name}.rung`);

    return new Promise((resolve, reject) => {
        zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
            .pipe(fs.createWriteStream(target))
            .on('error', reject)
            .on('finish', () => resolve(target));
    });
});

/**
 * Appends a file or folder to the zip buffer
 *
 * @param {Zip} zip
 * @param {String} dir
 * @param {String} filename
 */
function addToZip(zip, dir, filename) {
    const filePath = path.join(dir, filename);
    const lstat = fs.lstatSync(filePath);

    if (lstat.isFile()) {
        return zip.file(filename, fs.readFileSync(filePath), defaultFileOptions);
    }

    if (lstat.isDirectory()) {
        return map(file => addToZip(zip.folder(filename), filePath, file),
            fs.readdirSync(filePath));
    }

    throw new Error(`Invalid file type for ${filePath}`);
}

/**
 * Precompiles an extension and generates a .rung package
 *
 * @param {Object} args
 */
export default function build(args) {
    const dir = path.resolve('.', args._[1] || '');

    return fs.readdirAsync(dir)
        .then(filterFiles)
        .then(appendLocales)
        .then(precompileLocales)
        .then(createZip(dir))
        .then(zip => all([zip, getProjectName(dir)]))
        .spread(saveZip(args.output || '.'))
        .tap(() => emitSuccess('Rung extension compilation'));
}
