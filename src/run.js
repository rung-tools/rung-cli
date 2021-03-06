import fs from 'fs';
import { all, promisify } from 'bluebird';
import {
    curry,
    mapObjIndexed,
    mergeAll,
    prop,
    values
} from 'ramda';
import Table from 'cli-table';
import { runAndGetAlerts, getProperties } from './vm';
import { ask } from './input';
import { compileES6 } from './compiler';
import { read } from './db';
import { getLocale, getLocaleStrings } from './i18n';
import { compileModulesFromSource } from './module';
import live from './live';

const percentOf = curry((value, percent) => value / 100 * percent);

export const readFile = promisify(fs.readFile);

function tableView(alerts) {
    const valuesFrom = mapObjIndexed(({ title, content = '', comment = '' }, key) =>
        [key, title, content, comment]) & values;

    const table = new Table({
        head: ['Key', 'Title', 'Content', 'Comment'],
        colWidths: [10, 20, 35, 26].map(percentOf(process.stdout.columns || 100) & Math.round)
    });

    table.push(...valuesFrom(alerts));
    return table.toString();
}

export function compileSources() {
    return readFile('index.js', 'utf-8')
        .then(index => all([compileES6(index), compileModulesFromSource(index)]));
}

/**
 * Executes a function with the provided parameters
 *
 * @param {Object} params
 */
export const executeWithParams = params => readFile('package.json', 'utf-8')
    .then(JSON.parse)
    .then(({ name }) => all([name, read(name), getLocaleStrings(), getLocale()]))
    .spread((name, db, strings, locale) => compileSources()
        .spread((source, modules) => runAndGetAlerts(
            { name, source }, { params, db, locale }, strings, modules)))
    .get('alerts');

export default args => readFile('package.json', 'utf-8')
    .then(JSON.parse)
    .then(({ name }) => all([name, read(name), getLocaleStrings(), getLocale()]))
    .spread((name, db, strings, locale) => compileSources()
        .spread((source, modules) => getProperties({ name, source }, strings, modules)
            .then(prop('params') & ask)
            .then(mergeAll)
            .then(params => all([
                runAndGetAlerts({ name, source }, { params, db, locale }, strings, modules),
                params
            ]))))
    .spread(({ alerts }, params) => {
        if (args.live) {
            return live(alerts, params);
        }
        console.log(args.raw ? alerts : tableView(alerts));
    });
