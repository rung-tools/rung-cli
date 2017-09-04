import path from 'path';
import { promisify } from 'bluebird';
import { expect } from 'chai';
import rimraf from 'rimraf';
import { createStream } from './helper';

const rm = promisify(rimraf);

describe('readme.js', () => {
    before(~rm('./test/data/hello-world/README.md'));

    describe('Generation', () => {
        it('should generate README for a hello world', () => {
            process.chdir(path.join(__dirname, 'data/hello-world'));
            const stream = createStream(['readme'], '../../../dist/cli.js');

            return stream.once('data')
                .then(warning => {
                    expect(warning).to.match(/generated README.md/);
                    expect('README.md').to.be.a.file();
                })
                .finally(() => {
                    stream.close();
                    process.chdir(path.join(__dirname, '..'));
                });
        }).timeout(25000);
    });
});
