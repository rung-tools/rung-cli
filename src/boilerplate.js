import fs from 'fs';
import { promisify, reject, resolve } from 'bluebird';
import { IO } from './input';
import { askQuestions } from './init';

const createFolder = promisify(fs.mkdir);

/**
 * Creates the folder for the boilerplate based on package name. If the folder
 * already exists, throw an error
 *
 * @param {Object} {name}
 * @return {Promise}
 */
function createBoilerplateFolder({ name }) {
    return createFolder(name)
        .catch(() => reject(`Unable to create folder ${name}`));
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
        .finally(io.close.bind(io));
}