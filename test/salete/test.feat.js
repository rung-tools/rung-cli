import process from 'process';
import { expect } from 'chai';
import work, { keepCalm, createFile, createFolder, remove } from './salete';

const test = {
    runs: ['node', '../dist/cli.js', 'test'],
    does: [keepCalm(20)]
};

// Inception! Mocha runs Salete that runs RungTests written by the user that are
// written on top of Mocha and Chai. Too proud of it!
export default () => {
    before(~process.chdir('salete-hello-world'));

    it('should emit an error for Salete when she runs `rung test` without tests', () => {
        return work(test)
            .then(output => {
                expect(output).to.contain('Error: no tests provided');
            });
    }).timeout(keepCalm(40));

    it('should emit error when requiring an internal module in test file', () => {
        return createFolder('test')
            .then(~createFile('test/index.js', 'import app from "../index";'))
            .then(~work(test))
            .then(output => {
                expect(output).to.contain('Error: only external modules can be required in testsuite');
            });
    });

    it('should tell when the test file exists, but there are no tests to run', () => {
        return remove('test/index.js')
            .then(~createFile('test/index.js', ''))
            .then(~work(test))
            .then(output => {
                expect(output).to.contain('Info: no tests to run');
            });
    });

    after(~process.chdir('..'));
};
