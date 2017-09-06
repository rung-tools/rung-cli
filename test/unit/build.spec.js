import path from 'path';
import { expect } from 'chai';
import { promisify } from 'bluebird';
import rimraf from 'rimraf';
import { split } from 'ramda';
import work, { keyboard } from '../salete/salete';
import { createStream } from './helper';

const rm = promisify(rimraf);
const { wait } = keyboard;

describe('build.js', () => {
    describe('Failures', () => {
        it('should stop when there is no index file', () => {
            const stream = createStream(['build']);

            return stream.once('data')
                .then(output => {
                    expect(output).to.match(/Error: missing index.js from the project/);
                })
                .finally(stream.close);
        }).timeout(10000);
    });
});
