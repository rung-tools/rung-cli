import fs from 'fs';
import path from 'path';
import http from 'http';
import opn from 'opn';
import { promisify, props } from 'bluebird';
import {
    has,
    head,
    lensProp,
    map,
    mergeAll,
    over,
    replace,
    values,
    when
} from 'ramda';
import { compile } from 'handlebars';
import { Converter } from 'showdown';
import { readFile } from './run';
import { emitInfo } from './input';

const readDirectory = promisify(fs.readdir);

/**
 * Returns the source Handlebars template as string
 *
 * @return {Promise}
 */
function getHandlebarsTemplate() {
    return readFile(path.join(__dirname, '../templates/preview.hb'), 'utf-8')
        .then(compile);
}

/**
 * Returns an object with resource path and buffer
 *
 * @return {Promise}
 */
const getResources = () => {
    const resources = path.join(__dirname, '../resources/preview');
    return readDirectory(resources)
        .map(filename => props({
            [`/${filename}`]: readFile(path.join(resources, filename))
        }))
        .then(mergeAll);
};

/**
 * Compiles the content of the alerts to be compatible with HTML
 *
 * @param {Object} alerts
 * @return {Object[]}
 */
const compileAlerts = alerts => {
    const converter = new Converter();
    return alerts
        | map(when(has('comment'),
            over(lensProp('comment'), replace(/^[ \t]+/gm, '') & converter.makeHtml)))
        | values;
};

/**
 * Deploys a Rung CLI live server to stream content and allow hot reloading
 *
 * @param {String} content
 * @param {Number} port
 * @return {Promise}
 */
function startLiveServer(content, port) {
    return getResources().then(resources => {
        const server = http.createServer((req, res) => {
            // Provide resource when asked
            if (resources[req.url]) {
                return res.end(resources[req.url]);
            }

            // Stream live content
            return emitInfo(req.url)
                .then(~res.end(content));
        });

        const listen = promisify(server.listen.bind(server));
        return listen(port);
    })
    .then(~emitInfo(`hot reloading server listening on http://localhost:${port}/`));
}

/**
 * Generates a HTML file compiled from template showing the alerts as they will
 * be rendered on Rung and opens it in the default browser
 *
 * @return {Promise}
 */
export default ({ alerts }) => getHandlebarsTemplate()
    .then(generatePreview => {
        const content = compileAlerts(alerts);
        return generatePreview({
            alerts: content,
            sidebar: head(content)
        });
    })
    .then(content => {
        return startLiveServer(content, 5001)
            .then(~opn('http://localhost:5001/'));
    });
