import { expect } from 'chai';
import { createCustomStream } from './helper';

describe('publish.js', () => {
    describe('Custom environment', () => {
        it('should refuse malformed URL', () => {
            const stream = createCustomStream({ RUNG_API: 'foo' }, ['publish']);
            const next = (text = '') => stream.write(`${text}\r`)
                    .then(() => stream.once('data'));

            return stream.once('data')
                .then(output => {
                    expect(output).to.match(/Warning: invalid API for Rung: "foo"/);
                    return stream.once('data');
                })
                .then(output => {
                    expect(output).to.match(/Rung email/);
                    return next('oh@xanaina.com');
                })
                .then(output => {
                    expect(output).to.match(/Rung password/);
                    return next('my_super_secure_password_rsrs');
                })
                .then(output => {
                    console.log(output);
                    return stream.once('data');
                })
                .finally(stream.close);
        }).timeout(15000);
    });
});
