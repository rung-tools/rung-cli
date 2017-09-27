#!/usr/bin/env node
import yargs from 'yargs';
import { concat, memoize } from 'ramda';

/**
 * Lazy loading and cache of an internal ES6 module
 *
 * @param {String} module - Module to evaluate
 * @return {*}
 */
const getModule = memoize(concat('./') & require);

/**
 * Entry point of Rung CLI
 *
 * @param {Object} args
 */
function cli(args) {
    const { _: [command] } = args;
    return getModule(command).default(args)
        .catch(err => {
            getModule('input').emitError(err.message);
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
    .option('live', {
        describe: 'Live mode',
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
