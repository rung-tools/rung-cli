import { expect } from 'chai';
import { resolveValue } from '../src/input';
import { String as Text } from '../src/types';

describe('input.js', () => {
    describe('Value parsing', () => {
        it('should get a simple string', () => {
            const value = resolveValue('test', Text, null, true);
            expect(value).to.equals('test');
        });

        it('should return null for a required string', () => {
            const value = resolveValue('', Text, null, true);
            expect(value).to.be.null;
        });

        it('should accept the default value of a string', () => {
            const value = resolveValue('', Text, 'alaska', false);
            expect(value).to.equals('alaska');
        });
    });
});
