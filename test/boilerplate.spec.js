import path from 'path';
import { stdin } from 'process';
import { all, delay, promisify } from 'bluebird';
import chai, { expect } from 'chai';
import fs from 'chai-fs';
import json from 'chai-json-schema';
import rimraf from 'rimraf';
import boilerplate from '../src/boilerplate';

chai.use(fs);
chai.use(json);

const rm = promisify(rimraf);

describe('boilerplate.js', () => {
    describe('Input and output', () => {
    });
});
