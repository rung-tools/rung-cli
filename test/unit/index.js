import compiler from './compiler.spec';
import db from './db.spec';
import i18n from './i18n.spec';
import module from './module.spec';
import vm from './vm.spec';

export default () => {
    describe('compiler.spec', compiler);
    describe('db.spec', db);
    describe('i18n.spec', i18n);
    describe('module.spec', module);
    describe('vm.spec', vm);
};
