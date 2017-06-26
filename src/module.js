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
    propSatisfies
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
export const findModules = () => fileMatching('*.{js,json}');

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
        ]))
        .then(fromPairs);
}
