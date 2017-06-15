import fs from 'fs';
import os from 'os';
import { all, promisify } from 'bluebird';
import { mergeAll, prop } from 'ramda';
import { Spinner } from 'cli-spinner';
import { green } from 'colors/safe';
import { runAndGetAlerts, getProperties } from './vm';
import { ask } from './input';
import { compileES6 } from './compiler';
import { read } from './db';
import { getLocale, getLocaleStrings } from './i18n';

const user = { name: os.userInfo().username };

export const readFile = promisify(fs.readFile);

export const compileIndex = () =>
    readFile('index.js', 'utf-8').then(compileES6);

export default function run() {
    const spinner = new Spinner(green('%s running extension...'));
    spinner.setSpinnerString(8);

    return readFile('package.json', 'utf-8')
        .then(JSON.parse)
        .then(json => all([json.name, compileIndex(), read(json.name),
            getLocaleStrings(), getLocale()]))
        .spread((name, source, db, strings, locale) => getProperties({ name, source }, strings)
            .then(prop('params'))
            .then(ask)
            .then(mergeAll)
            .tap(() => spinner.start())
            .then(params => runAndGetAlerts({ name, source },
                { params, db, locale, user }, strings)))
        .tap(() => spinner.stop(true))
        .tap(console.log.bind(console));
}
