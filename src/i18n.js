import { resolve } from 'bluebird';
import osLocale from 'os-locale';
import { curry, propOr } from 'ramda';

/**
 * Returns the user locale. Firstly consider the env variable and, if it
 * doesn't exist, consider machine's locale
 *
 * @return {Promise}
 */
export function getLocale() {
    const { RUNG_LOCALE } = process.env;

    return RUNG_LOCALE
        ? resolve(RUNG_LOCALE)
        : osLocale();
}

/**
 * Translates a string or fallback to the key
 *
 * @param {Object} map - Object containing extension strings
 * @param {String} key - Key to search in hashmap
 * @return {String}
 */
export const translator = curry((map, key) => propOr(key, key, map));
