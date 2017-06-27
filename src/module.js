import fs from 'fs';
import glob from 'glob';
import { all, promisify, reject } from 'bluebird';
import {
    T,
    cond,
    endsWith,
    fromPairs,
    lensIndex,
    over,
    pipe,
    propSatisfies,
    without
} from 'ramda';
import { compileES6 } from './compiler';

const fileMatching = promisify(glob);
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
export const findModules = () => fileMatching('*.{js,json}')
    .then(without('index.js'));

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
export function evaluateModules(vm, modules) {
    // TODO: Use flatMap instead, to allow multiple module names!
    return fromPairs(modules.map(([module, source]) => {
        const name = `./${module}`;
        // JSON doesn't need to run on VM. We can directly parse it
        if (endsWith('.json', module)) {
            return [name, { default: JSON.parse(source) }];
        }

        if (endsWith('.js', module)) {
            return [name, vm.run(source, module)];
        }

        throw new Error(`Unknown file type for ${module}`);
    }));
}
