#!/usr/bin/env node

import yargs from 'yargs';
import { emitError } from './input';
import build from './build';
import run from './run';
import publish from './publish';
import boilerplate from './boilerplate';
import readme from './readme';
import db from './db';

const commands = {
    build, run, publish, boilerplate, readme, db
};

function cli(args) {
    const { _: [command] } = args;
    commands[command](args)
        .catch(err => {
            emitError(err.message);
            process.exit(1);
        });
}

cli(yargs
    .usage('Usage: $0 [build|run|publish|readme|db]')
    .command('build', 'Generate a .rung package')
    .command('publish [file]', 'Publishes the extension to the Rung store')
    .command('run', 'Execute the current extension')
    .command('boilerplate', 'Generates the boilerplate files for your extension')
    .command('readme', 'Generates the README.md file to publish')
    .command('db [option]', '[read|clear] Read or clear db for extension')
    .option('o', {
        alias: 'output',
        describe: 'Where to save the built package',
        type: 'string'
    })
    .option('private', {
        describe: 'If it is a private extension',
        type: 'boolean'
    })
    .option('raw', {
        describe: 'Display returned data as it is',
        type: 'boolean'
    })
    .option('file', {
        describe: 'File to publish to Rung Store',
        type: 'string'
    })
    .strict()
    .demandCommand(1)
    .recommendCommands()
    .help()
    .version()
    .argv);
