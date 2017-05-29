import { expect } from 'chai';
import { createStream } from './helper';

describe('build.js', () => {
    describe('Failures', () => {
        it('should stop when there is no index file', () => {
            const stream = createStream(['build']);

            return stream.once('data')
                .then(output => {
                    expect(output).to.match(/something went wrong/);
                    return stream.once('data');
                })
                .then(output => {
                    expect(output).to.match(/Error: Missing index/);
                })
                .finally(stream.close);
        }).timeout(10000);
    });
});
