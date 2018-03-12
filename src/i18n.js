import path from 'path';
import fs from 'fs';
import { promisify, resolve } from 'bluebird';
import osLocale from 'os-locale';
import { curry, propOr, replace } from 'ramda';

const readFile = promisify(fs.readFile);

/**
 * Returns the user locale. Firstly consider the env variable and, if it
 * doesn't exist, consider machine's locale
 *
 * @return {Promise}
 */
export function getLocale() {
    const { RUNG_LOCALE } = process.env;
    return resolve(RUNG_LOCALE ? RUNG_LOCALE : osLocale());
}

/**
 * Translates a string or fallback to the key
 *
 * @param {Object} map - Object containing app strings
 * @param {String} key - Key to search in hashmap
 * @return {String}
 */
export const translator = curry((map, key, params = {}) => {
    const sentence = propOr(key, key, map);

    return replace(
        /{{(\w+)}}/g,
        (full, partial) => params[partial] || full,
        sentence
    );
});

/**
 * Reads the JSON file corresponding to a specific locale
 *
 * @return {Promise}
 */
export function getLocaleStrings() {
    return getLocale()
        .then(locale => readFile(path.join('locales', `${locale}.json`)))
        .then(JSON.parse)
        .catchReturn({});
}
