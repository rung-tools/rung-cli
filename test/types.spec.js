import { expect } from 'chai';
import {
    Char,
    DoubleRange,
    Integer,
    IntegerRange,
    IntegerMultiRange,
    OneOf,
    getTypeName,
} from '../src/types';

describe('types.js', () => {
    describe('Existing types', () => {
        it('should support Char(n)', () => {
            const type = Char(10);
            expect(type).property('name').to.equals('Char');
            expect(type).property('length').to.equals(10);
        });

        it('should support IntegerRange(m, n)', () => {
            const type = IntegerRange(10, 20);
            expect(type).property('name').to.equals('IntegerRange');
            expect(type).property('from').to.equals(10);
            expect(type).property('to').to.equals(20);
        });

        it('should support DoubleRange(m, n)', () => {
            const type = DoubleRange(10, 20);
            expect(type).property('name').to.equals('DoubleRange');
            expect(type).property('from').to.equals(10);
            expect(type).property('to').to.equals(20);
        });

        it('should support OneOf(xs)', () => {
            const type = OneOf(['A', 'B']);
            expect(type).property('name').to.equals('OneOf');
            expect(type).property('values').to.contain('A');
            expect(type).property('values').to.contain('B');
        });

        it('should support IntegerMultiRange(m, n)', () => {
            const type = IntegerMultiRange(0, 100);
            expect(type).property('name').to.equals('IntegerMultiRange');
            expect(type).property('from').to.equals(0);
            expect(type).property('to').to.equals(100);
        });
    });

    describe('Type names', () => {
        it('should recognize Char(n)', () => {
            const name = getTypeName(Char(10));
            expect(name).to.equals('Char(10)');
        });

        it('should recognize IntegerRange(m, n)', () => {
            const name = getTypeName(IntegerRange(10, 20));
            expect(name).to.equals('IntegerRange(10, 20)');
        });

        it('should recognize DoubleRange(m, n)', () => {
            const name = getTypeName(DoubleRange(10, 20));
            expect(name).to.equals('DoubleRange(10, 20)');
        });

        it('should recognize OneOf(xs)', () => {
            const name = getTypeName(OneOf(['A', 'B']));
            expect(name).to.equals('OneOf([A, B])');
        });

        it('should return name for any other type', () => {
            expect(getTypeName(Integer)).to.equals('Integer');
        });
    });
});
