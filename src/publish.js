import fs from 'fs';
import { all, resolve, promisify } from 'bluebird';
import { curry, isNil, pick, pipe } from 'ramda';
import { gray } from 'colors';
import superagent from 'superagent';
import { isURL } from 'validator';
import { emitWarning, IO } from './input';
import build from './build';

const readFile = promisify(fs.readFile);
const request = superagent.agent();

/**
 * Returns the Rung API URL. Emits a warning when the URL is possibly invalid
 *
 * @param {IO} io
 * @return {String}
 */
function fetchRungApi(io) {
    const envApi = process.env.RUNG_API;

    if (isNil(envApi)) {
        return 'https://app.rung.com.br/api';
    }

    if (!isURL(envApi)) {
        emitWarning(io, `invalid API for Rung: ${envApi}`);
    }

    return envApi;
}

/**
 * After login, publishes the extension
 *
 * @param {String} api
 * @param {String} path
 * @return {Promise}
 */
const publishPackage = curry((api, path) => {
    const io = IO();

    return resolve(request.get(`${api}/whoami`))
        .then(({ body }) => io.print(`Logged in as ${body.exhibitionName || body.name}`))
        .then(() => readFile('package.json', 'utf-8').then(pipe(JSON.parse, pick(['name', 'version']))))
        .then(({ name, version }) => request.post(`${api}/metaExtensions`)
            .attach('metaExtension', path)
            .then(() => io.print(`Successfully published ${name}@${version}`)))
        .finally(io.close.bind(this));
});

/**
 * Authenticates and publishes the extension
 *
 * @param {Object} args
 * @return {Promise}
 */
export default function publish(args) {
    const io = IO();
    const api = fetchRungApi(io);

    return io.read(gray('Rung email'))
        .then(email => all([email, io.password(gray('Rung password'))]))
        .spread((email, password) => request.post(`${api}/login`)
            .send({ email, password }))
        .then(() => build(args))
        .then(publishPackage(api));
}
