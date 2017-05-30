import { expect } from 'chai';
import { createStream } from './helper';

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
