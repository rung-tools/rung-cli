import { expect } from 'chai';
import {
    compileModulesFromSource,
    evaluateModules,
    inspect
} from '../../src/module';
import { createVM } from '../../src/vm';

export default () => {
    describe('Module compilation', () => {
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
            expect(result).to.have.property('drag-queen.json');
            expect(result).to.have.property('workaround.js');
            expect(result).property('workaround.js').to.equals(42);
            expect(result).property('drag-queen.json').to.have.property('alaska');
        });

        it('should get module files from AST', () => {
            const { code, modules } = inspect(`
                import jquery from 'jquery';
                import isThirteen from 'is-thirteen';
                import workarounds from './gambiarras';
            `);

            expect(code).to.be.a('string');
            expect(modules).to.be.an('array');
            expect(modules).to.have.lengthOf(3);
            expect(modules).to.contain('jquery');
            expect(modules).to.contain('is-thirteen');
            expect(modules).to.contain('./gambiarras');
        });

        it('should reject when required file has no loader', () => {
            const source = 'import config from "./_config.yml"';
            return compileModulesFromSource(source)
                .then(() => {
                    throw new Error('Should never fall here');
                })
                .catch(err => {
                    expect(err.message).to.match(/Unknown module loader for file/);
                });
        });

        it('should reject compilation of unknown file', () => {
            const modules = [
                ['Main.hs', `
                    module Main where

                    main :: IO ()
                    main = putStrLn "Hello from Haskell!"
                `]
            ];
            const vm = createVM({});
            expect(~evaluateModules(vm, modules))
                .to.throw('Unknown file type for Main.hs');
        });
    });
};
