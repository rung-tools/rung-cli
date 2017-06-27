import { expect } from 'chai';
import { findModules, compileModules } from '../src/module';

describe('module.js', () => {
    describe('Module compilation', () => {
        it('should list all JS and JSON files', () => {
            return findModules()
                .then(files => {
                    expect(files).to.be.an('array');
                });
        });

        it('should correctly compile a JSON module', () => {
            return compileModules(['package.json'])
                .then(compiledFiles => {
                    expect(compiledFiles).to.be.an('array');
                    expect(compiledFiles).to.have.length(1);
                });
        });

        it('should correctly compile a JS module', () => {
            return compileModules(['./test/module.spec.js', './test/build.spec.js'])
                .then(compiledFiles => {
                    expect(compiledFiles).to.be.an('array');
                });
        });
    });
});