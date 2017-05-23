import fs from 'fs';
import { all, promisify } from 'bluebird';
import { mergeAll, prop } from 'ramda';
import { runAndGetAlerts, getProperties } from './vm';
import { ask } from './input';
import { compileES6 } from './compiler';
import { read } from './db';

export const readFile = promisify(fs.readFile);

export function compileSourceFile({ main }) {
    const index = main || 'index.js';
    return readFile(index, 'utf-8').then(compileES6);
}

export default function run() {
    return readFile('package.json', 'utf-8')
        .then(JSON.parse)
        .then(json => all([json.name, compileSourceFile(json), read(json.name)]))
        .spread((name, source, db) => getProperties({ name, source })
            .then(prop('params'))
            .then(ask)
            .then(mergeAll)
            .then(params => runAndGetAlerts({ name, source }, { params, db })))
        .tap(console.log.bind(console));
}

