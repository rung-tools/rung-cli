import osLocale from 'os-locale';

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
