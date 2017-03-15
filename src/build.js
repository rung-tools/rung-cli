import path from 'path';
import yargs from 'yargs';
import Zip from 'jszip';
import {
    __,
    T,
    cond,
    curry,
    equals,
    head,
    map,
    pick,
    pipe,
    prop,
    tryCatch,
    without
} from 'ramda';
import Promise, { resolve, promisifyAll, promisify } from 'bluebird';
const fs = promisifyAll(require('fs'));

const requiredFiles = ['package.json', 'index.js'];
const ignoredFiles = ['node_modules', '.git'];

function assertRequiredFiles(files) {
    const missingFiles = without(files, requiredFiles);
    if (missingFiles.length > 0) {
        throw new Error(`Missing ${missingFiles} from the project!`);
    }
    return files;
}

const ignoreUnwantedFiles = without(ignoredFiles);

function validatePackage(rungPackage) {
    // TODO: implement package validation
    return rungPackage;
}

const extractProjectInfo = curry((dir, files) => {
    return fs.readFileAsync(path.join(dir, 'package.json'))
        .then(JSON.parse)
        .catchThrow(new Error('Failed to parse package.json from the project.'))
        .then(pipe(
            validatePackage,
            projectInfo => [files, projectInfo]));
})

function resolveOutputTarget(customPath, fileName) {
    const realPath = path.resolve('.', customPath);
    try {
        const lstat = fs.lstatSync(realPath);
        if (lstat.isDirectory()) {
            return path.join(realPath, fileName);
        }
    } catch (_) { /* Everything is fine... */ }

    return realPath;
}

const saveZip = curry((zip, projectInfo, customPath = '.') => {
    const target = resolveOutputTarget(customPath, `${projectInfo.name}.rung`);

    return new Promise((resolve, reject) => {
        zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
            .pipe(fs.createWriteStream(target))
            .on('end', resolve)
            .on('error', reject);
    });
});

const createZip = curry((dir, files, projectInfo) => {
    const zip = new Zip();

    files.forEach(fileName => {
        addToZip(zip, dir, fileName);
    });

    return [zip, projectInfo];
});

function addToZip(zip, dir, fileName) {
    const filePath = path.join(dir, fileName);
    const lstat = fs.lstatSync(filePath);

    if (lstat.isFile()) {
        return zip.file(fileName, filePath);
    }

    if (lstat.isDirectory()) {
        return map(
            file => addToZip(zip.folder(fileName), filePath, file),
            fs.readdirSync(filePath));
    }

    throw new Error(`Invalid file type for ${filePath}`);
}

export function build(args) {
    const dir = path.resolve('.', args._[1] || '');

    return fs.readdirAsync(dir)
        .then(assertRequiredFiles)
        .then(ignoreUnwantedFiles)
        .then(extractProjectInfo(dir))
        .spread(createZip(dir))
        .spread(saveZip(__, __, args.output));
}
