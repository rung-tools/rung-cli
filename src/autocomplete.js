import fs from 'fs';
import path from 'path';
import Promise, { all, promisify } from 'bluebird';
import agent from 'superagent';
import promisifyAgent from 'superagent-promise';
import R, {
    fromPairs,
    is,
    take,
    test
} from 'ramda';
import { compileES6 } from './compiler';
import { runInBrowser } from './vm';

const readFile = promisify(fs.readFile);
const directory = promisify(fs.readdir);

const lib = {
    request: promisifyAgent(agent, Promise),
    ramda: R
};

/**
* Converts a string to a native JS closure
*
* @param {String} code
* @return {*}
*/
export const stringToClosure = compileES6 & runInBrowser({ module: {}, exports: {} });

/**
 * Adapts the user provided closure to Inquirer style. If the user provides
 * a 2+ arguments closure, it has a done callback; otherwise expect to be a
 * promise. If a promise is not provided, it is an error
 *
 * @param {String} name
 * @param {String} source
 * @return {(Object, String) -> Promise}
 */
export function compileClosure(name, source) {
    const functor = stringToClosure(source);
    if (!is(Function, functor)) {
        throw new TypeError(`autocomplete/${name}.js must export a function`);
    }

    return (params, input) => new Promise(resolve => {
        const context = { params, input: input || '', lib };
        if (functor.length < 2) {
            return resolve(functor(context));
        }

        functor(context, resolve);
    });
}

/**
 * Reads all the autocomplete sources and returns an object containing the
 * name of the parameter as key and the source as value
 *
 * @return {Promise}
 */
export default ~directory('./autocomplete/')
    .catch({ code: 'ENOENT' }, ~[])
    .filter(test(/^.*\.js$/))
    .map(file => all([
        take(file.length - 3, file),
        readFile(path.join('autocomplete', file), 'utf-8')]))
    .then(fromPairs);
