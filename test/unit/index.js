import chai from 'chai';
import fs from 'chai-fs';
import json from 'chai-json-schema';
import compiler from './compiler.spec';
import db from './db.spec';
import i18n from './i18n.spec';
import module from './module.spec';
import vm from './vm.spec';

chai.use(fs);
chai.use(json);

describe('Unit tests', () => {
    describe('compiler.spec', compiler);
    describe('db.spec', db);
    describe('i18n.spec', i18n);
    describe('module.spec', module);
    describe('vm.spec', vm);
});
