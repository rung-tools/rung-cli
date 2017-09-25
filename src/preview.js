import fs from 'fs';
import path from 'path';
import temp from 'temp';
import opn from 'opn';
import { promisify } from 'bluebird';
import { compile } from 'handlebars';
import { readFile } from './run';

temp.track();

const mkDir = promisify(temp.mkdir);
const writeFile = promisify(fs.writeFile);
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
 * Copies the resource files to the specified location
 *
 * @param {String} target
 * @return {Promise}
 */
const copyResources = target => {
    const resources = path.join(__dirname, '../resources/preview');
    return readDirectory(resources)
        .map(filename => {
            const fullPath = path.join(resources, filename);
            const targetPath = path.join(target, filename);
            return fs.createReadStream(fullPath)
                .pipe(fs.createWriteStream(targetPath));
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
 * Generates a HTML file compiled from template showing the alerts as they will
 * be rendered on Rung and opens it in the default browser
 *
 * @return {Promise}
 */
export default alerts => getHandlebarsTemplate()
    .then(generatePreview => generatePreview(alerts))
    .then(openInBrowser);
