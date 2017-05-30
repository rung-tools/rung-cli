import path from 'path';
import Zip from 'jszip';
import {
    __,
    concat,
    contains,
    curry,
    filter,
    identity,
    map,
    pipe,
    sort,
    subtract,
    test,
    tryCatch,
    type,
    without
} from 'ramda';
import Promise, { promisifyAll } from 'bluebird';
import { emitWarning } from './input';

const fs = promisifyAll(require('fs'));

const defaultFileOptions = { date: new Date(1149562800000) };
const requiredFiles = ['package.json', 'index.js'];
const projectFiles = ['icon.png', ...requiredFiles];

/**
 * Ensures there are missing no files in order to a allow a basic compilation.
 * It also warns about possible improvements in the extensions
 *
 * @param {String[]} files
 */
function analyzeFiles(files) {
    const missingFiles = without(files, requiredFiles);

    if (missingFiles.length > 0) {
        throw new Error(`missing ${missingFiles.join(', ')} from the project`);
    }

    if (!contains('icon.png', files)) {
        emitWarning('compiling extension without providing an icon.png file');
    }

    return files;
}

const filterProjectFiles = filter(contains(__, projectFiles));

/**
 * Filters true locale files and appends the full qualified name for the
 * previous files
 *
 * @param {String[]} files
 * @return {Promise}
 */
function appendLocales(files) {
    return fs.lstatAsync('locales')
        .then(lstat => lstat.isDirectory() ? fs.readdirAsync('locales') : [])
        .then(filter(test(/^[a-z]{2}(_[A-Z]{2,3})?\.json$/)))
        .filter(filename => fs.readFileAsync(path.join('locales', filename))
            .then(pipe(JSON.parse, item => type(item) === 'Object'))
            .catchReturn(false))
        .then(pipe(map(file => path.join('locales', file)), concat(files)))
        .catchReturn(files);
}

/**
 * Opens package.json and extrats its contents. Returns a promise containing
 * the file list to be zipped and the package.json content parsed
 *
 * @param {String} dir
 * @param {String[]} files
 * @return {Promise}
 */
const extractProjectInfo = curry((dir, files) => {
    return fs.readFileAsync(path.join(dir, 'package.json'))
        .then(JSON.parse)
        .catchThrow(new Error('Failed to parse package.json from the project.'))
        .then(projectInfo => [files, projectInfo]);
});

/**
 * Generates a zip package using a node buffer containing the necessary files
 *
 * @param {String} dir
 * @param {String[]} files
 * @param {Object} projectInfo
 */
const createZip = curry((dir, files, projectInfo) => {
    const zip = new Zip();
    files.forEach(filename => addToZip(zip, dir, filename));
    return [zip, projectInfo];
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
 * @param {Zip} zip
 * @param {Object} projectInfo
 * @param {String} customPath
 */
const saveZip = curry((zip, projectInfo, customPath = '.') => {
    const target = resolveOutputTarget(customPath, `${projectInfo.name}.rung`);

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
        .then(analyzeFiles)
        .then(filterProjectFiles)
        .then(appendLocales)
        .then(sort(subtract))
        .then(extractProjectInfo(dir))
        .spread(createZip(dir))
        .spread(saveZip(__, __, args.output));
}
