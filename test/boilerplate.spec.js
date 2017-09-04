import path from 'path';
import { all, delay, promisify } from 'bluebird';
import chai, { expect } from 'chai';
import fs from 'chai-fs';
import json from 'chai-json-schema';
import rimraf from 'rimraf';
import boilerplate from '../src/boilerplate';
import process from 'process';
import createMonkey, { ENTER } from './monkey';

chai.use(fs);
chai.use(json);

const rm = promisify(rimraf);

describe('boilerplate.js', () => {
    describe('Input and output', () => {
    });
});
