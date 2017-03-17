import fs from 'fs';
import { promisify } from 'bluebird';

const readFile = promisify(fs.readFile);

function readSourceFile({ main }) {
    const index = main || 'index.js';
    return readFile(index, 'utf-8');
}

export default function run() {
    return readFile('package.json', 'utf-8')
        .then(JSON.parse)
        .then(readSourceFile);
}

