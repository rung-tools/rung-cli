import fs from 'fs';
import { promisify } from 'bluebird';
import { emitError } from './input';

export const readFile = promisify(fs.readFile);

export default async () =>
    readFile('test/indexs.js', 'utf-8')
        .then(content => {
            console.log(content);
        })
        .catch(~emitError('No tests to run. [test/index.js] not found'));
