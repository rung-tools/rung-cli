import path from 'path';
import { delay } from 'bluebird';
import { expect } from 'chai';
import intercept from 'intercept-stdout';
import { createStream } from './helper';

describe('run.js', () => {
    describe('Execution', () => {
        it('should execute a hello world', () => {
            process.chdir(path.join(__dirname, 'data/hello-world'));
            const stream = createStream(['run'], '../../../dist/cli.js');

            return stream.once('data')
                .then(askName => {
                    expect(askName).to.match(/What is your name/);
                    return stream.write('Harmony\n\n');
                })
                .then(() => {
                    const result = [];
                    const unhook = intercept(result.push(_));
                    return delay(5000)
                        .tap(unhook)
                        .return(result);
                })
                .then(result => {
                    expect(result.join('')).to.equals('');
                })
                .finally(() => {
                    stream.close();
                    process.chdir(path.join(__dirname, '..'));
                });
        }).timeout(25000);
    });
});
