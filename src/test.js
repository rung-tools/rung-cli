import fs from 'fs';
import { promisify } from 'bluebird';
import { read } from './db';
import { getLocale, getLocaleStrings } from './i18n';
import { compileSources } from './run';
import { getProperties, runInSandbox } from './vm';

export const readFile = promisify(fs.readFile);

export default async () => {
    const test = await readFile('test/index.js', 'utf-8');
    const { name } = await readFile('package.json', 'utf-8')
        | JSON.parse;
    const db = await read(name);
    const locale = await getLocale();
    const strings = await getLocaleStrings();
    const [source, modules] = await compileSources();
    const properties = await getProperties({ name, source }, strings, modules);
    const app = await runInSandbox(name, source, strings, modules);
    console.log(app)
};
