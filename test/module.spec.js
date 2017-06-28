import { expect } from 'chai';
import {
    compileModules,
    evaluateModules,
    findAndCompileModules ,
    findModules
} from '../src/module';
import { createVM } from '../src/vm';

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

        it('should bootstrap the rung-cli project!!!', () => {
            return findAndCompileModules()
                .then(results => {
                    expect(results).to.be.an('array');
                });
        }).timeout(20000);

        it('should compile and evaluate modules', () => {
            const modules = [
                ['drag-queen.json', JSON.stringify({
                    alaska: 1,
                    courtney: 2
                })],
                ['workaround.js', `
                    module.exports = 42;
                `]
            ];

            const vm = createVM({});
            const result = evaluateModules(vm, modules);
            expect(result).to.be.an('object');
            expect(result).to.have.property('./drag-queen.json');
            expect(result).to.have.property('./drag-queen');
            expect(result).to.have.property('./workaround.js');
            expect(result).to.have.property('./workaround');
            expect(result).property('./workaround').to.equals(42);
            expect(result).property('./drag-queen').to.have.property('alaska');
        });
    });
});