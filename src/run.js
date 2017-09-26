import fs from 'fs';
import os from 'os';
import { all, promisify } from 'bluebird';
import {
    curry,
    mapObjIndexed,
    mergeAll,
    prop,
    values,
    when
} from 'ramda';
import { Spinner } from 'cli-spinner';
import { green } from 'colors/safe';
import Table from 'cli-table';
import { runAndGetAlerts, getProperties } from './vm';
import { ask } from './input';
import { compileES6 } from './compiler';
import { read } from './db';
import { getLocale, getLocaleStrings } from './i18n';
import { compileModulesFromSource } from './module';
import preview from './preview';

const user = { name: os.userInfo().username };
const percentOf = curry((value, percent) => value / 100 * percent);

export const readFile = promisify(fs.readFile);

function tableView(data) {
    const valuesFrom = mapObjIndexed(({ title, content = '', comment = '' }, key) =>
        [key, title, content, comment]) & values;

    const table = new Table({
        head: ['Key', 'Title', 'Content', 'Comment'],
        colWidths: [10, 20, 35, 26].map(percentOf(process.stdout.columns || 100) & Math.round)
    });

    table.push(...valuesFrom(data.alerts));
    return table.toString();
}

export function compileSources() {
    return readFile('index.js', 'utf-8')
        .then(index => all([compileES6(index), compileModulesFromSource(index)]));
}

export default function run(args) {
    const spinner = new Spinner(green('%s running extension...'));
    spinner.setSpinnerString(8);

    return readFile('package.json', 'utf-8')
        .then(JSON.parse)
        .then(({ name }) => all([name, read(name), getLocaleStrings(), getLocale()]))
        .spread((name, db, strings, locale) => compileSources()
            .spread((source, modules) => getProperties({ name, source }, strings, modules)
                .then(prop('params') & ask)
                .then(mergeAll)
                .tap(~spinner.start())
                .then(params => runAndGetAlerts({ name, source },
                    { params, db, locale, user }, strings, modules))))
        .tap(~spinner.stop(true))
        .tap(when(~args.preview, preview))
        .then(when(~!args.raw, tableView))
        .tap(when(~!args.preview), console.log);
}
