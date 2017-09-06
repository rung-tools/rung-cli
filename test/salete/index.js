import { promisify } from 'bluebird';
import rimraf from 'rimraf';
import help from './help.feat';
import version from './version.feat';
import boilerplate from './boilerplate.feat';
import build from './build.feat';
import readme from './readme.feat';

const rm = promisify(rimraf);

export default () => {
    // before(~rm('salete-hello-world'));
    // after(~rm('salete-hello-world'));
    describe('help.feat', help);
    describe('version.feat', version);
    describe('boilerplate.feat', boilerplate);
    describe('build.feat', build);
    describe('readme.feat', readme);
};
