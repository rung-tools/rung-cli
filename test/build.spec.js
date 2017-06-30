import { expect } from 'chai';
import path from 'path';
import fs from 'chai-fs';
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

    describe('Compilation', () => {
        it('should compile a hello world', () => {
            process.chdir(path.join(__dirname, 'data/hello-world'));
            const stream = createStream(['build'], '../../../dist/cli.js');

            return stream.once('data')
                .then(warning => {
                    expect(warning).to.match(/compiling extension without providing an icon.png file/);
                    return stream.once('data');
                })
                .then(success => {
                    expect(success).to.match(/Rung extension compilation/);
                    expect('hello-world.rung').to.be.a.file();
                })
                .finally(() => {
                    stream.close();
                    process.chdir(path.join(__dirname, '..'));
                });
        }).timeout(25000);
    });
});
