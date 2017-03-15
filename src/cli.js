import path from 'path';
import yargs from 'yargs';
import { head, pipe, cond, equals, prop, T, pick } from 'ramda';
import { resolve, reject, promisifyAll } from 'bluebird';
import { build } from './build';

const commandEquals = value => pipe(prop('_'), head, equals(value));

const executeCommand = cond([
    [commandEquals('init'), init],
    [commandEquals('build'), build],
    [commandEquals('rung'), run]
]);

function cli(args) {
    executeCommand(args)
        .catch(err => {
            console.log('Ooooops, something went wrong...');
            console.log(err.stack);
            process.exit(1);
        });
}

function init(args) {
    return reject('Not implemented yet!');
}

function run(args) {
    return reject('Not implemented yet!');
}

cli(yargs
    .usage('Usage: $0 [init|build|run]')
    .command('init', 'Initialize a blank extension project')
    .command('build', 'Generate a .rung package')
    .command('run', 'Execute the current extension')
    .option('o', {
        alias: 'output',
        describe: 'Where to save the built package',
        type: 'string'
    })
    .strict()
    .demandCommand(1)
    .recommendCommands()
    .argv);