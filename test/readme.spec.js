import { expect } from 'chai';
import { createStream } from './helper';

describe('readme.js', () => {
    describe('Failures', () => {
        it('should stop because there is no title in rung-cli', () => {
            const stream = createStream(['readme']);

            return stream.once('data')
                .then(output => {
                    expect(output).to.match(/something went wrong/);
                    return stream.once('data');
                })
                .then(output => {
                    expect(output).to.match(/Error: Cannot read property 'title'/);
                })
                .finally(stream.close);
        }).timeout(10000);
    });
});
