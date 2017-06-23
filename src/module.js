import fs from 'fs';
import glob from 'glob';
import { all, promisify, reject } from 'bluebird';
import {
    T,
    cond,
    endsWith,
    find,
    fromPairs,
    identity,
    invoker,
    lensIndex,
    mapObjIndexed,
    nth,
    over,
    pipe,
    prop,
    propSatisfies,
    tryCatch
} from 'ramda';
import { Left, Right } from 'data.either';
import { fromNullable } from 'data.maybe';
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
    const compileJSONModule = tryCatch(pipe(JSON.parse, JSON.stringify, Right), Left);
    const compileES6Module = tryCatch(pipe(compileES6, Right), Left);

    return all(modules.map(getFileTuple))
        .map(cond([
            [propSatisfies(endsWith('json'), 0), over(lensIndex(1), compileJSONModule)],
            [propSatisfies(endsWith('js'), 0), over(lensIndex(1), compileES6Module)],
            [T, reject]
        ]))
        .then(modulePairs => {
            const error = fromNullable(find(propSatisfies(prop('isLeft'), 1), modulePairs))
                .map(pipe(nth(1), applicative => applicative.fold(identity)));

            return error.isJust
                ? reject(error)
                : mapObjIndexed(invoker(0, 'get'), fromPairs(modulePairs));
        });
}
