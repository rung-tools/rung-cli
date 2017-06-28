import { expect } from 'chai';
import intercept from 'intercept-stdout';
import { IO, resolveValue, triggerWarnings } from '../src/input';
import { String as Text } from '../src/types';
import { compileES6 } from '../src/compiler';

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

    describe('Warnings', () => {
        it('should trigger a warning when has named parameter language', () => {
            let result = '';
            const stopReading = intercept(text => result += text);
            const io = IO();
            triggerWarnings(io, { language: {} })
                .then(() => {
                    stopReading();
                    expect(result).to.match(/Warning: don't use context.params.language/);
                });
        });
    });
});