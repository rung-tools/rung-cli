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
    describe.only('Compile boilerplate', () => {
        after(~rm('very-cool-project'));

        it('should compile the generated boilerplate', () => {
            process.chdir('very-cool-project');
            const npm = {
                runs: ['npm', 'install'],
                does: [wait(5 * 60 * 1000)]
            };
            const compile = {
                runs: ['node', '../dist/cli.js', 'build'],
                does: [wait(30 * 1000)]
            };

            return work(npm)
                .then(() => {
                    void expect('node_modules').to.be.a.directory().and.not.empty;
                    return work(compile);
                })
                .then(output => {
                    const [warning, success] = output | split('\n');
                    expect(warning).to.contain('compiling extension without providing an icon.png file');
                    expect(success).to.contain('Rung extension compilation');
                })
                .finally(() => {
                    process.chdir('..');
                });
        }).timeout(90000);
    });

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
