import help from './help.feat';
import version from './version.feat';
import boilerplate from './boilerplate.feat';

export default () => {
    describe('help.feat', help);
    describe('version.feat', version);
    describe('boilerplate.feat', boilerplate);
};
