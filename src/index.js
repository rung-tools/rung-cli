#!/usr/bin/env node
import readline from 'readline';
import { argv } from 'yargs';
import { cond, contains } from 'ramda';

function init() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    rl.on('line', l => console.log(l));
}

const executeAction = cond([
    [contains('init'), init]
]);

executeAction(argv._);