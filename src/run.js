import fs from 'fs';
import { promisify } from 'bluebird';
import { mergeAll, prop } from 'ramda';
import { runAndGetAlerts, getProperties } from './vm';
import { ask } from './input';

export const readFile = promisify(fs.readFile);

export function readSourceFile({ main }) {
    const index = main || 'index.js';
    return readFile(index, 'utf-8');
}

export default function run() {
    return readFile('package.json', 'utf-8')
        .then(JSON.parse)
        .then(readSourceFile)
        .then(source => getProperties({ name: 'get-parameters', source })
            .then(prop('params'))
            .then(ask)
            .then(mergeAll)
            .then(params =>
                runAndGetAlerts({ name: 'get-alerts', source }, { params })))
        .tap(console.log.bind(console));
}

