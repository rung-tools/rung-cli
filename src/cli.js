#!/usr/bin/env node

import yargs from 'yargs';
import { head, pipe, cond, equals, prop } from 'ramda';
import { reject } from 'bluebird';
import build from './build';
import run from './run';
import init from './init';
import publish from './publish';

const commandEquals = value => pipe(prop('_'), head, equals(value));

const executeCommand = cond([
    [commandEquals('init'), init],
    [commandEquals('build'), build],
    [commandEquals('run'), run],
    [commandEquals('publish'), publish]
]);

function cli(args) {
    executeCommand(args)
        .catch(err => {
            console.log('Ooooops, something went wrong...');
            console.log(new String(err).valueOf());
            process.exit(1);
        });
}

cli(yargs
    .usage('Usage: $0 [init|build|run|publish]')
    .command('init', 'Initialize a blank extension project')
    .command('build', 'Generate a .rung package')
    .command('publish', 'Publishes the extension to the Rung store')
    .command('run', 'Execute the current extension')
    .option('o', {
        alias: 'output',
        describe: 'Where to save the built package',
        type: 'string'
    })
    .strict()
    .demandCommand(1)
    .recommendCommands()
    .version()
    .argv);
