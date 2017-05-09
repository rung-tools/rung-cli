import fs from 'fs';
import { all, resolve, promisify } from 'bluebird';
import { pick, pipe } from 'ramda';
import { gray } from 'colors';
import superagent from 'superagent';
import { IO } from './input';
import build from './build';

const readFile = promisify(fs.readFile);

const publicApi = 'https://app.rung.com.br/api';
const request = superagent.agent();

/**
 * After login, publishes the extension
 *
 * @param {String} path
 * @return {Promise}
 */
function publishPackage(path) {
    const io = IO();

    return resolve(request.get(`${publicApi}/whoami`))
        .then(({ body }) => io.print(`Logged in as ${body.exhibitionName || body.name}`))
        .then(() => readFile('package.json', 'utf-8').then(pipe(JSON.parse, pick(['name', 'version']))))
        .then(({ name, version }) => request.post(`${publicApi}/metaExtensions`)
            .attach('metaExtension', path)
            .then(() => io.print(`Successfully published ${name}@${version}`)))
        .finally(io.close.bind(this));
}

/**
 * Authenticates and publishes the extension
 *
 * @param {Object} args
 * @return {Promise}
 */
export default function publish(args) {
    const io = IO();

    return io.read(gray('Rung email'))
        .then(email => all([email, io.password(gray('Rung password'))]))
        .spread((email, password) => request.post(`${publicApi}/login`)
            .send({ email, password }))
        .then(() => build(args))
        .then(publishPackage);
}
