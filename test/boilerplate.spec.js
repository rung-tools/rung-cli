import path from 'path';
import { resolve } from 'bluebird';
import chai, { expect } from 'chai';
import fs from 'chai-fs';
import json from 'chai-json-schema';
import { createStream, monkey, ENTER } from './helper';

chai.use(fs);
chai.use(json);

describe('boilerplate.js', () => {
    describe('Input and output', () => {
        it.only('should correctly deal with the questions', () => {
            const stream = createStream(['boilerplate']);

            return monkey(stream, [
                'somewhere',
                ENTER,
                '0.2.0',
                ENTER,
                'fooo',
                ENTER
            ])
                .then(out => {
                    console.log('8888', out, '9999');
                })
        }).timeout(15000);
    });
});
