import fs from 'fs';
import { all, promisify } from 'bluebird';
import { mergeAll, prop } from 'ramda';
import { runAndGetAlerts, getProperties } from './vm';
import { ask } from './input';
import { compileES6 } from './compiler';
import { read } from './db';
import { getLocaleStrings } from './i18n';

export const readFile = promisify(fs.readFile);

export function compileSourceFile({ main }) {
    const index = main || 'index.js';
    return readFile(index, 'utf-8').then(compileES6);
}

export default function run() {
    return readFile('package.json', 'utf-8')
        .then(JSON.parse)
        .then(json => all([json.name, compileSourceFile(json), read(json.name), getLocaleStrings()]))
        .spread((name, source, db, strings) => getProperties({ name, source }, strings)
            .then(prop('params'))
            .then(ask)
            .then(mergeAll)
            .then(params => runAndGetAlerts({ name, source }, { params, db }, strings)))
        .tap(console.log.bind(console));
}

