#!/usr/bin/env node

import yargs from 'yargs';
import { head, pipe, cond, equals, prop } from 'ramda';
import build from './build';
import run from './run';
import init from './init';
import publish from './publish';
import boilerplate from './boilerplate';
import readme from './readme';
import db from './db';

const commandEquals = value => pipe(prop('_'), head, equals(value));

const executeCommand = cond([
    [commandEquals('init'), init],
    [commandEquals('build'), build],
    [commandEquals('run'), run],
    [commandEquals('publish'), publish],
    [commandEquals('boilerplate'), boilerplate],
    [commandEquals('readme'), readme],
    [commandEquals('db'), db]
]);

function cli(args) {
    executeCommand(args)
        .catch(err => {
            console.log('Ooooops, something went wrong...');
            console.log(String(err));
            process.exit(1);
        });
}

cli(yargs
    .usage('Usage: $0 [init|build|run|publish|readme|db]')
    .command('init', 'Initialize a blank extension project')
    .command('build', 'Generate a .rung package')
    .command('publish', 'Publishes the extension to the Rung store')
    .command('run', 'Execute the current extension')
    .command('boilerplate', 'Generates the boilerplate files for your extension')
    .command('readme', 'Generates the README.md file to publish')
    .command('db [option]', '[read|clear] Read or clear db for extension')
    .option('o', {
        alias: 'output',
        describe: 'Where to save the built package',
        type: 'string'
    })
    .strict()
    .demandCommand(1)
    .recommendCommands()
    .help()
    .version()
    .argv);
