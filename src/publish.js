import path from 'path';
import { promisify, resolve } from 'bluebird';
import { curry, isNil } from 'ramda';
import superagent from 'superagent';
import { isURL } from 'validator';
import rimraf from 'rimraf';
import inquirer from 'inquirer';
import { emitError, emitWarning } from './input';
import build from './build';
import { validator } from './types';

const request = superagent.agent();
const rm = promisify(rimraf);

/**
 * Returns the Rung API URL. Emits a warning when the URL is possibly invalid
 *
 * @return {String}
 */
function fetchRungApi() {
    const envApi = process.env.RUNG_API;

    if (isNil(envApi)) {
        return 'https://app.rung.com.br/api';
    }

    if (!isURL(envApi)) {
        emitWarning(`invalid API for Rung: ${JSON.stringify(envApi)}`);
    }

    return envApi;
}

/**
 * Publishes a Rung package from a file
 *
 * @param {String} api
 * @param {String} filename
 * @return {Promise}
 */
const publishFile = curry((api, filename) =>
    request.post(`${api}/metaExtensions/draft`)
        .attach('metaExtension', filename)
        .then(~rm(filename)));

/**
 * Builds or uses the passed file to publication
 *
 * @param {Object} args
 * @return {Promise}
 */
function resolveInputFile(args) {
    const { file } = args;
    return file ? resolve(path.resolve(file)) : build(args);
}

/**
 * Authenticates and publishes the extension
 *
 * @param {Object} args
 * @return {Promise}
 */
export default function publish(args) {
    const api = fetchRungApi();

    return inquirer.prompt([
        { name: 'email', message: 'Rung email', validate: validator.Email },
        { name: 'password', type: 'password', message: 'Rung password' }])
        .then(payload => payload | request.post(`${api}/login`).send)
        .then(~resolveInputFile(args))
        .then(publishFile(api))
        .catch(err => {
            emitError(err.message);
        });
}
