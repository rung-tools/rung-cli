import path from 'path';
import os from 'os';
import { remove } from './salete';
import help from './help.feat';
import version from './version.feat';
import boilerplate from './boilerplate.feat';
import build from './build.feat';
import readme from './readme.feat';
import db from './db.feat';
import run from './run.feat';

export default () => {
    before(~remove(path.join(os.homedir(), '.rung', 'rung-cli.db')));
    // before(~rm('salete-hello-world'));
    // after(~rm('salete-hello-world'));
    describe('help.feat', help);
    describe('version.feat', version);
    describe('boilerplate.feat', boilerplate);
    describe('build.feat', build);
    describe('readme.feat', readme);
    describe('db.feat', db);
    describe('run.feat', run);
};
