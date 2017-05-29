import fs from 'fs';
import path from 'path';
import { promisify, reject } from 'bluebird';
import {
    append,
    dropWhile,
    equals,
    join,
    juxt,
    merge,
    pick,
    pipe,
    replace
} from 'ramda';
import { version as rungCliVersion } from '../package';
import { IO } from './input';
import { askQuestions } from './init';

const createFolder = promisify(fs.mkdir);
const createFile = promisify(fs.writeFile);

/**
 * Formats a formatted String
 *
 * @param {String} source
 * @return {String}
 */
const format = pipe(
    replace(/\n {8}/g, '\n'),
    dropWhile(equals('\n')),
    append('\n'),
    join('')
);

/**
 * Creates a file with the passed content. Receives the format
 * { filename :: String, content :: String }
 *
 * @param {Object} {filename, content}
 * @return {Promise}
 */
function writeFileFromObject({ filename, content }) {
    return createFile(filename, content)
        .catch(() => reject(`Unable to create file ${filename}`));
}

/**
 * Creates the folder for the boilerplate based on package name. If the folder
 * already exists, throw an error
 * Queria estar morta
 *
 * @param {Object} answers
 * @return {Promise}
 */
function createBoilerplateFolder(answers) {
    return createFolder(answers.name)
        .catch(() => reject(`Unable to create folder ${answers.name}`))
        .thenReturn(answers);
}

/**
 * Returns an object in the format { filename :: String, content :: String }
 * containing meta-informations about the file
 *
 * @param {Object} answers
 * @return {Object}
 */
function getPackageMetaFile(answers) {
    const packageFields = ['name', 'version', 'license', 'main', 'category'];
    const packageObject = merge(pick(packageFields, answers),
        { dependencies: { 'rung-cli': rungCliVersion } });

    return {
        filename: path.join(answers.name, 'package.json'),
        content: JSON.stringify(packageObject, null, 2) };
}

/**
 * Content about README.md file
 *
 * @param {Object} answers
 * @return {Object}
 */
function getReadMeMetaFile(answers) {
    const content = format(`
        # Rung ─ ${answers.title}

        # Development

        - Use \`yarn\` to install the dependencies
        - Use \`rung run\` to start the CLI wizard
    `);

    return {
        filename: path.join(answers.name, 'README.md'),
        content };
}

/**
 * Content about index.js file
 *
 * @param {Object} answers
 * @return {Object}
 */
function getIndexFile(answers) {
    const content = format(`
        import { create } from 'rung-sdk';
        import { String as Text } from 'rung-cli/dist/types';

        function main(context) {
            const { name } = context.params;
            return {
                alerts: [_('Hello {{name}}', { name })]
            };
        }

        const params = {
            name: {
                description: _('What is your name?'),
                type: Text
            }
        };

        export default create(main, {
            params,
            title: _(${JSON.stringify(answers.title)}),
            description: _(${JSON.stringify(answers.description)})
        });
    `);

    return { filename: path.join(answers.name, 'index.js'), content };
}

/**
 * Creates a boilerplate project
 *
 * @return {Promise}
 */
export default function boilerplate() {
    const io = IO();
    return askQuestions(io)
        .then(createBoilerplateFolder)
        .then(juxt([getPackageMetaFile, getReadMeMetaFile, getIndexFile]))
        .map(writeFileFromObject)
        .finally(io.close.bind(io));
}
