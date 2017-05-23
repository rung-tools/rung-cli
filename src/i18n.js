import path from 'path';
import { all, promisifyAll, resolve } from 'bluebird';
import osLocale from 'os-locale';
import { curry, propOr } from 'ramda';

const fs = promisifyAll(require('fs'));

/**
 * Returns the user locale. Firstly consider the env variable and, if it
 * doesn't exist, consider machine's locale
 *
 * @return {Promise}
 */
export function getLocale() {
    const { RUNG_LOCALE } = process.env;

    return resolve(RUNG_LOCALE
        ? RUNG_LOCALE
        : osLocale());
}

/**
 * Translates a string or fallback to the key
 *
 * @param {Object} map - Object containing extension strings
 * @param {String} key - Key to search in hashmap
 * @return {String}
 */
export const translator = curry((map, key) => propOr(key, key, map));

/**
 * Reads the JSON file corresponding to a specific locale
 *
 * @return {Promise}
 */
export function getLocaleStrings() {
    return getLocale()
        .then(locale => {
            const localePath = path.join('locales', `${locale}.json`);
            return all([fs.lstatAsync(localePath), localePath]);
        })
        .spread((lstat, localePath) => lstat.isFile()
            ? fs.readFileAsync(localePath).then(JSON.parse)
            : {})
        .catchReturn({});
}
