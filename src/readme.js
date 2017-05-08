import fs from 'fs';
import { resolve } from 'bluebird';
import { getProperties } from './vm';
import { readFile } from './run';

export default function readme() {
    return readFile('package.json', 'utf-8')
        .then(JSON.parse);
}