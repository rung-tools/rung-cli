import fs from 'fs';
import { reject, resolve, promisify } from 'bluebird';
import { keys, last, merge, split } from 'ramda';
import { gray } from 'colors';
import { IO } from './input';

const writeFile = promisify(fs.writeFile);

/**
 * Creates a package.json file with provided data
 *
 * @author Marcelo Haskell Camargo
 * @param {Object} answers - The answers provided by the programmer
 * @return {Promise}
 */
function createPackage(answers) {
    if (fs.existsSync('package.json')) {
        return reject('package.json already exists');
    }

    return writeFile('package.json', JSON.stringify(answers, null, 2));
}

/**
 * Initializes a blank extension with data provided by the programmer
 *
 * @author Marcelo Haskell Camargo
 * @return {Promise}
 */
export default function init() {
    const workingDirectory = last(split('/', process.cwd()));
    const io = IO();

    const questions = {
        name: workingDirectory,
        version: '1.0.0',
        description: '',
        'entry point': 'index.js',
        license: 'MIT'
    };

    // We chain the blocking promises and they return the fulfilled answers
    const ask = questions => keys(questions).reduce((promise, key) =>
        promise.then(prevAnswers =>
            io.read(gray(`${key} (${questions[key]})`))
                .then(answer => merge(prevAnswers, answer.trim() === '' ? {} : {
                    [key]: answer
                }))), resolve(questions));

    return ask(questions)
        .then(createPackage)
        .then(() => io.print('package.json created'))
        .finally(io.close.bind(io));
}

