import { expect } from 'chai';
import { __require } from '../src/vm';

describe('vm.js', () => {
    describe('Module system', () => {
        it('should allow a module in whitelist to be required', () => {
            const lib = __require(['rung-sdk', 'moment'], 'moment');
            expect(lib).to.be.an('function');
        });

        it('should forbid a module that is not whitelisted to be required', () => {
            expect(() => {
                const lib = __require(['rung-sdk', 'moment'], 'fs');
            }).to.throw(/Disallowed dependency/);
        });
    })
});