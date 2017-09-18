import fs from 'fs';
import path from 'path';
import Bluebird, { all, promisify } from 'bluebird';
import agent from 'superagent';
import promisifyAgent from 'superagent-promise';
import R, { fromPairs, take, test } from 'ramda';
import { compileES6 } from './compiler';
import { runInBrowser } from './vm';

const readFile = promisify(fs.readFile);
const directory = promisify(fs.readdir);

export const stdlib = {
    request: promisifyAgent(agent, Bluebird),
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
 * Reads all the autocomplete sources and returns an object containing the
 * name of the parameter as key and the source as value
 *
 * @return {Promise}
 */
export default ~directory('./autocomplete/')
    .filter(test(/^.*\.js$/))
    .map(file => all([
        take(file.length - 3, file),
        readFile(path.join('autocomplete', file), 'utf-8')]))
    .then(fromPairs);
