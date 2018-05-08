import path from 'path';
import os from 'os';
import chai from 'chai';
import fs from 'chai-fs';
import json from 'chai-json-schema';
import { remove } from './salete';
import help from './help.feat';
import version from './version.feat';
import boilerplate from './boilerplate.feat';
import build from './build.feat';
import readme from './readme.feat';
import db from './db.feat';
import run from './run.feat';
import test from './test.feat';
import input from './input.feat';
import publish from './publish.feat';

chai.use(fs);
chai.use(json);

describe('Human tests', () => {
    before(~remove('salete-hello-world') & ~remove(path.join(os.homedir(), '.rung', 'rung-cli.db')));
    after(() => {
        remove('salete-hello-world');
    });
    describe('help.feat', help);
    describe('version.feat', version);
    describe('boilerplate.feat', boilerplate);
    describe('build.feat', build);
    describe('readme.feat', readme);
    describe('db.feat', db);
    describe('run.feat', run);
    describe('test.feat', test);
    describe('input.feat', input);
    describe('publish.feat', publish);
});
