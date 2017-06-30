import fs from 'fs';
import glob from 'glob';
import { all, promisify, reject } from 'bluebird';
import {
    T,
    chain as flatMap,
    cond,
    endsWith,
    fromPairs,
    lensIndex,
    merge,
    over,
    pipe,
    propSatisfies,
    reject as rejectWhere,
    test,
    without
} from 'ramda';
import { transform } from 'babel-core';
import { compileES6 } from './compiler';

export const fileMatching = promisify(glob);
const readFile = promisify(fs.readFile);

/**
 * Returns a tuple containing the file name and its content
 *
 * @param {String} filename
 * @return {String[]}
 */
const getFileTuple = filename => readFile(filename, 'utf-8')
    .then(content => [filename, content]);

/**
 * Finds each JS and JSON file of the folder
 *
 * @return {Promise}
 */
export const findModules = () => fileMatching('{*,*/*}.{js,json}')
    .then(without(['index.js']))
    .then(rejectWhere(test(/^node_modules(\/|\\)/)));

/**
 * Compiles a list of JS or JSON modules
 *
 * @param {String[]} modules
 * @return {Promise}
 */
export function compileModules(modules) {
    return all(modules.map(getFileTuple))
        .map(cond([
            [propSatisfies(endsWith('json'), 0), over(lensIndex(1), pipe(JSON.parse, JSON.stringify))],
            [propSatisfies(endsWith('js'), 0), over(lensIndex(1), compileES6)],
            [T, reject]
        ]));
}

/**
 * Finds and compiles all modules
 *
 * @return {Promise}
 */
export function findAndCompileModules() {
    return findModules().then(compileModules);
}

/**
 * Evaluates a list of pairs of modules. modules :: [(String, String)]
 *
 * @param {NodeVM} vm - Virtual machine instance to run
 * @param {String[][]} modules pairs, with [name :: string, source :: string]
 */
export const evaluateModules = (vm, modules) => fromPairs(flatMap(([module, source]) => {
    const fullName = `./${module}`;
    const partialName = fullName.replace(/\.[a-z]+$/i, '');
    // JSON doesn't need to run on VM. We can directly parse it

    const convertToBytecode = cond([
        [endsWith('.json'), () => JSON.parse(source)],
        [endsWith('.js'), module => vm.run(source, module)],
        [T, module => {
            throw new Error(`Unknown file type for ${module}`);
        }]
    ]);

    const bytecode = convertToBytecode(module);
    return [
        [fullName, bytecode],
        [partialName, bytecode]
    ];
}, modules));

/**
 * Inspects a JS source and returns processed information, such as ES5 code,
 * the ast, source map and the used modules
 *
 * @param {String} source - ES6 source
 * @return {String[]}
 */
export function inspect(source) {
    const modules = [];
    const result = transform(source, {
        comments: false,
        compact: true,
        presets: ['es2015', 'react'],
        plugins: [
            ['transform-react-jsx', { pragma: '__render__' }],
            [() => ({
                visitor: {
                    ImportDeclaration({ node }) {
                        modules.push(node.source.value);
                    }
                }
            })]
        ]
    });

    return merge(result, { modules });
}
