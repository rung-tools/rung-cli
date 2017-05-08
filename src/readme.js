import fs from 'fs';
import path from 'path';
import { all, promisify } from 'bluebird';
import { compile } from 'handlebars';
import {
    keys,
    lensProp,
    merge,
    over,
    replace,
    values,
    zipWith
} from 'ramda';
import { getProperties } from './vm';
import { readFile } from './run';
import { getTypeName } from './types';
import { version as rungCliVersion } from '../package';

const createFile = promisify(fs.writeFile);

/**
 * Returns the source Handlebars template as string
 *
 * @return {Promise}
 */
function getHandlebarsTemplate() {
    return readFile(path.join(__dirname, '../templates/readme.hb'), 'utf-8')
        .then(compile);
}

/**
 * Converts an object to an array containing a list of { name, version }
 *
 * @param {Object} dependencies
 * @return {Array}
 */
function dependenciesToArray(dependencies) {
    return zipWith((name, version) => ({ name, version }),
        keys(dependencies),
        values(dependencies));
}

/**
 * Converts an object to an array containing a list of { name, type, description }
 *
 * @param {Object} parameters
 * @return {Array}
 */
function parametersToArray(parameters) {
    return zipWith((name, { type, description }) => ({
        name,
        type: getTypeName(type),
        description }),
        keys(parameters),
        values(parameters));
}

/**
 * Generates a full README in Markdown with documentation about input parameters
 * and the business rules of the extension
 *
 * @return {Promise}
 */
export default function readme() {
    return readFile('package.json', 'utf-8')
        .then(JSON.parse)
        .then(({ name, version, description, author, rung, dependencies, main }) => all([{
            rungCliVersion,
            name,
            version,
            description,
            author,
            title: rung.title,
            escapedName: replace(/-/g, '--', name),
            dependencies: dependenciesToArray(dependencies) },
            readFile(main || 'index.js', 'utf-8')
                .then(source => getProperties({ name: 'pre-compile', source }))]))
        .spread((partialContext, source) => merge(partialContext, {
            parameters: parametersToArray(source.params),
        }))
        .then(context => all([context, getHandlebarsTemplate()]))
        .spread((context, generateReadme) => generateReadme(context))
        .then(content => createFile('README.md', content));
}