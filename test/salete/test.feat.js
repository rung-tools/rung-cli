import process from 'process';
import { expect } from 'chai';
import work, { keepCalm, createFile, createFolder, remove } from './salete';

const test = {
    runs: ['node', '../dist/cli.js', 'test'],
    does: [keepCalm(20)]
};

const saletest = {
    withInternalModules: 'import app from "../index";',
    empty: '',
    breakingSynchronous: [
        'import { expect } from "chai";',
        '',
        'test("This should pass", app => {',
        '   expect(app).to.be.a("function");',
        '});',
        '',
        'test("This should break", app => {',
        '   expect(app).to.be.a("string");',
        '});'
    ].join('\n'),
    breakingAsynchronous: [
        'import { expect } from "chai";',
        '',
        'test("Breaking after running the app", app => {',
        '   return app({ params: { name: "Judith" } })',
        '       .then(result => expect(result).to.be.a("string"));',
        '});'
    ].join('\n'),
    passing: [
        'import { expect } from "chai";',
        '',
        'test("I promise it will pass", app => {',
        '   return app({ params: { name: "Judith" } })',
        '       .then(result => {',
        '           expect(result).to.be.an("object");',
        '           expect(result).to.have.property("alerts")',
        '       });',
        '});'
    ].join('\n')
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
            .then(~createFile('test/index.js', saletest.withInternalModules))
            .then(~work(test))
            .then(output => {
                expect(output).to.contain('Error: only external modules can be required in testsuite');
            });
    }).timeout(keepCalm(40));

    it('should tell when the test file exists, but there are no tests to run', () => {
        return remove('test/index.js')
            .then(~createFile('test/index.js', saletest.empty))
            .then(~work(test))
            .then(output => {
                expect(output).to.contain('Info: no tests to run');
            });
    }).timeout(keepCalm(40));

    it('should report breaking synchronous test', () => {
        return remove('test/index.js')
            .then(~createFile('test/index.js', saletest.breakingSynchronous))
            .then(~work(test))
            .then(output => {
                expect(output).to.contain('Success: This should pass');
                expect(output).to.contain('Error: This should break');
                expect(output).to.contain('AssertionError');
                expect(output).to.contain('1 passing, 1 failing');
            });
    }).timeout(keepCalm(40));

    it('should report breaking asynchronous test', () => {
        return remove('test/index.js')
            .then(~createFile('test/index.js', saletest.breakingAsynchronous))
            .then(~work(test))
            .then(output => {
                expect(output).to.contain('Breaking after running the app');
                expect(output).to.contain('0 passing, 1 failing');
            });
    }).timeout(keepCalm(40));

    it('should pass all tests', () => {
        return remove('test/index.js')
            .then(~createFile('test/index.js', saletest.passing))
            .then(~work(test))
            .then(output => {
                expect(output).to.contain('Success: I promise it will pass');
                expect(output).to.contain('1 passing, 0 failing');
            })
    }).timeout(keepCalm(40));

    after(~process.chdir('..'));
};
