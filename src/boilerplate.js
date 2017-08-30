import fs from 'fs';
import path from 'path';
import { promisify, reject, resolve } from 'bluebird';
import {
    append,
    dropWhile,
    equals,
    join,
    juxt,
    keys,
    last,
    mapObjIndexed,
    merge,
    pick,
    replace,
    split
} from 'ramda';
import { gray } from 'colors';
import { version as rungCliVersion } from '../package';
import { IO } from './input';

const createFolder = promisify(fs.mkdir);
const createFile = promisify(fs.writeFile);

/**
 * Formats a formatted String
 *
 * @param {String} source
 * @return {String}
 */
const format = source => source
    | replace(/\n {8}/g, '\n')
    | dropWhile(equals('\n'))
    | append('\n')
    | join('');

/**
 * Generate the answers from the stdin.
 *
 * @param {IO} io
 * @return {Promise}
 */
export function askQuestions(io) {
    // [Question description, Default value]
    const questions = {
        name: ['Project name', last(split('/', process.cwd()))],
        version: ['Version', '1.0.0'],
        title: ['Title', ''],
        description: ['Description', ''],
        category: ['Category', 'miscellaneous'],
        license: ['License', 'MIT']
    };

    // We chain the blocking promises and they return the fulfilled answers
    return keys(questions).reduce((promise, key) =>
        promise.then(prevAnswers => {
            const [description, defaultValue] = questions[key];
            return io.read(gray(`${description} (${defaultValue})`))
                .then(value => merge(
                    prevAnswers,
                    value.trim() === ''
                        ? {}
                        : { [key]: value }));
        }),
        resolve(mapObjIndexed(last, questions)));
}

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
    const packageFields = ['name', 'version', 'license', 'category'];
    const packageObject = merge(pick(packageFields, answers),
        { dependencies: { 'rung-cli': rungCliVersion } });

    return {
        filename: path.join(answers.name, 'package.json'),
        content: JSON.stringify(packageObject, null, 2)
    };
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

        function render(name) {
            return <b>{ _('Hello {{name}}', { name }) }</b>;
        }

        function main(context) {
            const { name } = context.params;
            return {
                alerts: [{
                    title: _('Welcome'),
                    content: render(name),
                    resources: []
                }]
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
            primaryKey: true,
            title: _(${JSON.stringify(answers.title)}),
            description: _(${JSON.stringify(answers.description)}),
            preview: render('Trixie')
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
