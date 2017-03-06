#! /usr/bin/env node
import app from 'commander';
import types from './types';
import input from './input';
import vm from './vm';
import { version } from '../package';

app.version(version)
    .command('run', 'Run extension')
    .command('install [package]', 'Installs a npm package')
    .command('dev [<package]', 'Installs a npm package in dev-mode')
    .command('init', 'Initializes a Rung app')
    .command('release', 'Generates a .rung package')
    .parse(process.argv);

module.exports = { types, input, vm };
