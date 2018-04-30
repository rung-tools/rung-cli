import process from 'process';
import { expect } from 'chai';
import work, { keepCalm, createFile, createFolder } from './salete';

// Inception! Mocha runs Salete that runs RungTests written by the user that are
// written on top of Mocha and Chai. Too proud of it!
export default () => {
    before(~process.chdir('salete-hello-world'));

    it('should emit an error for Salete when she runs `rung test` without tests', () => {
        return work({
            runs: ['node', '../dist/cli.js', 'test'],
            does: [keepCalm(20)] })
            .then(output => {
                expect(output).to.contain('Error: No tests to run. [test/index.js] not found');
            });
    }).timeout(keepCalm(40));

    it('should create a static test file and run it successfully', () => {
        return createFolder('test')
            .then(~createFile('test/index.js', [
                'import { expect } from chai',
                '',
                'describe("Hello World!", () => {',
                '  expect(1).to.be.equal(1)',
                '})'
            ].join('\n')));
    });

    after(~process.chdir('..'));
};
