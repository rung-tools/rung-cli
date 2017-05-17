import os from 'os';
import fs from 'fs';
import path from 'path';
import { promisify, reject, resolve } from 'bluebird';
import rimraf from 'rimraf';
import {
    type
} from 'ramda';

const rm = promisify(rimraf);
const createFolder = promisify(fs.mkdir);
const createFile = promisify(fs.writeFile);

/**
 * Marshalls the JS input
 *
 * @param {Mixed} input
 * @return {Promise}
 */
function marshall(input) {
    const value = JSON.stringify(input);
    return value === undefined
        ? reject(new Error(`Unsupported type ${type(input)}`))
        : resolve(value);
}

/**
 * Gets the location of a database file
 *
 * @param {String} name - Database name
 * @return {String}
 */
function location(name) {
    return path.join(os.homedir(), '.rung', `${name}.db`);
}

/**
 * Clears a database file by removing it
 *
 * @param {String} name - Database name
 * @return {Promise}
 */
export function clear(name) {
    return rm(location(name));
}

/**
 * Creates or updates a database file
 *
 * @param {String} name - Database name
 * @param {Mixed} store - Content to save
 * @return {Promise}
 */
export function upsert(name, store) {
    // When store is undefined, drop the file
    return store === undefined
        ? clear(name)
        : resolveRungFolder()
        .then(() => marshall(store))
        .then(value => createFile(location(name), value));
}

/**
 * Creates the .rung folder when it doesn't exist
 *
 * @return {Promise}
 */
function resolveRungFolder() {
    const folder = path.join(os.homedir(), '.rung');

    return fs.existsSync(folder)
        ? resolve()
        : createFolder(folder);
}
