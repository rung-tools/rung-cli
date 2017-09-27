import fs from 'fs';
import path from 'path';
import http from 'http';
import opn from 'opn';
import { listen } from 'socket.io';
import Promise, { promisify, props } from 'bluebird';
import {
    has,
    join,
    lensProp,
    map,
    mergeAll,
    over,
    replace,
    when
} from 'ramda';
import { Converter } from 'showdown';
import { readFile } from './run';
import { emitInfo } from './input';

const readDirectory = promisify(fs.readdir);

/**
 * Emits the Rung emoji to the live server ;)
 *
 * @return {Promise}
 */
function emitRungEmoji() {
    return [
        '',
        '   ___       _  _______',
        '  / _ \\__ __/ |/ / ___/',
        ' / , _/ // /    / (_ /',
        '/_/|_|\\_,_/_/|_/\\___/',
        ''
    ] | join('\n') | emitInfo;
}

/**
 * Returns an object with resource path and buffer
 *
 * @return {Promise}
 */
const getResources = () => {
    const resources = path.join(__dirname, '../resources/live');
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
const compileMarkdown = alerts => {
    const converter = new Converter();
    return alerts
        | map(when(has('comment'),
            over(lensProp('comment'), replace(/^[ \t]+/gm, '') & converter.makeHtml)));
};

/**
 * Starts the stream server using sockets
 *
 * @param {Object} alerts
 * @param {Object} params
 * @param {Number} port
 * @param {Object} resources
 * @return {Promise}
 */
function startServer(alerts, params, port, resources) {
    const compiledAlerts = compileMarkdown(alerts);
    const app = http.createServer((req, res) =>
        res.end(resources[req.url] || resources['/index.html']));
    const io = listen(app);
    io.on('connection', socket => {
        emitInfo(`new session for ${socket.handshake.address}`);
        socket.emit('update', compiledAlerts);
        socket.on('disconnect', () => {
            emitInfo(`disconnected session ${socket.handshake.address}`);
        });
    });
    return new Promise(resolve => app.listen(port, emitRungEmoji & resolve));
}

/**
 * Generates a HTML file compiled from template showing the alerts as they will
 * be rendered on Rung and opens it in the default browser
 *
 * @return {Promise}
 */
export default (alerts, params) => getResources()
    .tap(startServer(alerts, params, 5001, _))
    .then(~opn('http://localhost:5001/'));
