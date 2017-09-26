import fs from 'fs';
import path from 'path';
import temp from 'temp';
import opn from 'opn';
import { promisify } from 'bluebird';
import {
    has,
    head,
    lensProp,
    map,
    over,
    replace,
    values,
    when
} from 'ramda';
import { compile } from 'handlebars';
import { Converter } from 'showdown';
import { readFile } from './run';

const mkDir = promisify(temp.mkdir);
const writeFile = promisify(fs.writeFile);
const readDirectory = promisify(fs.readdir);

/**
 * Copies a file
 *
 * @param {String} source
 * @param {String} target
 * @return {Promise}
 */
const copyFile = (source, target) => new Promise((resolve, reject) => {
    const read = fs.createReadStream(source);
    read.on('error', reject);
    const write = fs.createWriteStream(target);
    write.on('error', reject);
    write.on('close', resolve);
    read.pipe(write);
});

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
 * Copies the resource files to the specified location
 *
 * @param {String} target
 * @return {Promise}
 */
const copyResources = target => {
    const resources = path.join(__dirname, '../resources/preview');
    return readDirectory(resources)
        .map(filename => {
            const sourcePath = path.join(resources, filename);
            const targetPath = path.join(target, filename);
            return copyFile(sourcePath, targetPath);
        });
};

/**
 * Writes to a temp file and opens the content on the default browser
 *
 * @param {String} content
 * @return {Promise}
 */
const openInBrowser = content => mkDir('rung-preview')
    .tap(copyResources)
    .then(location => {
        const index = path.join(location, 'index.html');
        return writeFile(index, content)
            .then(~opn(index));
    });

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
    .then(openInBrowser);
