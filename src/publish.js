import fs from 'fs';
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
 * @param {Spinner} spinner
 * @param {String} path
 * @return {Promise}
 */
const publishPackage = curry((api, spinner, path) => {
    const io = IO();

    return resolve(request.get(`${api}/whoami`))
        .then(({ body }) => io.print(`Logged in as ${body.exhibitionName || body.name}`))
        .then(() => readFile('package.json', 'utf-8').then(pipe(JSON.parse, pick(['name', 'version']))))
        .tap(() => spinner.stop(true))
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
    const spinner = new Spinner(green('%s publishing extension...'));
    spinner.setSpinnerString(8);

    return io.read(gray('Rung email'))
        .then(email => all([email, io.password(gray('Rung password'))]))
        .tap(() => spinner.start())
        .spread((email, password) => request.post(`${api}/login`)
            .send({ email, password }))
        .then(() => build(args))
        .then(publishPackage(api, spinner))
        .tapCatch(() => spinner.stop(true));
}
