import fs from 'fs';
import path from 'path';
import http from 'http';
import net from 'net';
import opn from 'opn';
import { promisify, props } from 'bluebird';
import {
    has,
    head,
    join,
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
 * Starts the stream server using sockets
 *
 * @return {Promise}
 */
function startStreamServer() {
    const clients = [];
    net.createServer(socket => {
        socket.name = `${socket.remoteAddress}:${socket.remotePort}`;
        clients.push(socket);

        console.log(socket.header);

        emitInfo(socket.name);

        var instance = 0;
        const interval = setInterval(() => {
            emitInfo('foooi');
            socket.write(JSON.stringify(instance++));
        }, 500);

        socket.on('end', () => {
            clients.splice(clients.indexOf(socket), 1);
            clearInterval(interval);
        });
    }).listen(6001);
}

/**
 * Deploys a Rung CLI live server to stream content and allow hot reloading
 *
 * @param {Object} alerts
 * @param {String} content
 * @param {Number} port
 * @return {Promise}
 */
function startLiveServer(alerts, content, port) {
    // STREAM SERVER

    startStreamServer();

    return getResources().then(resources => {
        const server = http.createServer((req, res) => {
            // Provide resource when asked
            if (resources[req.url]) {
                return res.end(resources[req.url]);
            }

            // TODO: refatorar essa gambi
            if (req.url === '/alerts') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(alerts), 'utf-8');
                return;
            }

            // Stream live content
            return emitInfo(req.url)
                .then(~res.end(resources['/live.html']));
        });

        const listen = promisify(server.listen.bind(server));
        return listen(port);
    })
    .tap(emitRungEmoji)
    .tap(~emitInfo(`hot reloading server listening on http://localhost:${port}/`));
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
        return startLiveServer(alerts, content, 5001)
            .then(~opn('http://localhost:5001/'));
    });
