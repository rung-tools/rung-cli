import chai from 'chai';
import fs from 'chai-fs';
import json from 'chai-json-schema';
import salete from './salete';
import unit from './unit';

chai.use(fs);
chai.use(json);

describe('Rung CLI tests', () => {
    describe('Salete tests', salete);
    describe('Unit tests', unit);
});
