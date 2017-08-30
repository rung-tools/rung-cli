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
                    let result = '';
                    const stopReading = intercept(text => result += text);
                    return delay(5000)
                        .then(() => {
                            stopReading();
                            expect(result).to.equals('');
                        });
                })
                .finally(() => {
                    stream.close();
                    process.chdir(path.join(__dirname, '..'));
                });
        }).timeout(25000);
    });
});
