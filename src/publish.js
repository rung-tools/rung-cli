import fs from 'fs';
import path from 'path';
import { all, resolve, promisify } from 'bluebird';
import { curry, isNil, pick, pipe } from 'ramda';
import { gray } from 'colors';
import { Spinner } from 'cli-spinner';
import superagent from 'superagent';
import { isURL } from 'validator';
import { green } from 'colors/safe';
import { emitWarning, IO } from './input';
import build from './build';

const readFile = promisify(fs.readFile);
const request = superagent.agent();

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
 * @param {String} filename
 * @return {Promise}
 */
const publishFile = curry((api, filename) =>
    request.post(`${api}/metaExtensions`)
        .attach('metaExtension', filename));

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
    const io = IO();
    const api = fetchRungApi();
    const spinner = new Spinner(green('%s publishing extension...'));
    spinner.setSpinnerString(8);

    return io.read(gray('Rung email'))
        .then(email => all([email, io.password(gray('Rung password'))]))
        .tap(() => spinner.start())
        .spread((email, password) => request.post(`${api}/login`)
            .send({ email, password }))
        .then(() => resolveInputFile(args))
        .then(publishFile(api))
        .then(() => io.print('Successfully published'))
        .finally(() => spinner.stop(true));
}
