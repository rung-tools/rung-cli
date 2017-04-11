import fs from 'fs';
import { reject, resolve, promisify } from 'bluebird';
import {
    keys,
    last,
    merge,
    split,
    assoc,
    pick,
    head,
    mapObjIndexed
} from 'ramda';
import { gray } from 'colors';
import { IO } from './input';

const writeFile = promisify(fs.writeFile);
const workingDirectory = last(split('/', process.cwd()));

/**
 * Creates a package.json file with provided data
 *
 * @param {Object} answers - The answers provided by the programmer
 * @return {Promise}
 */
function createPackage(answers) {
    if (fs.existsSync('package.json')) {
        return reject('package.json already exists');
    }

    const packageFields = ['name', 'version', 'description', 'license', 'main'];
    const rungFields = ['title'];

    const packageObject = assoc(
        'rung',
        pick(rungFields, answers),
        pick(packageFields, answers));

    return writeFile('package.json', JSON.stringify(packageObject, null, 2));
}

/**
 * Generate the answers from the stdin.
 *
 * @return {Promise}
 */
function askQuestions(io) {
    // key: [Question description, Default value]
    const questions = {
        name:        ['Project name', workingDirectory],
        version:     ['Version',      '1.0.0'],
        title:       ['Title',        ''],
        description: ['Description',  ''],
        main:        ['Entry point',  'index.js'],
        license:     ['License',      'MIT']
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
 * Initializes a blank extension with data provided by the programmer
 *
 * @return {Promise}
 */
export default function init() {
    const io = IO();
    return askQuestions(io)
        .then(createPackage)
        .then(() => io.print('package.json created'))
        .finally(io.close.bind(io));
}

