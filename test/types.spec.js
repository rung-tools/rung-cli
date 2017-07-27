import { expect } from 'chai';
import {
    AutoComplete,
    Char,
    DoubleRange,
    Integer,
    IntegerRange,
    IntegerMultiRange,
    OneOf,
    cast,
    getTypeName,
    valueOrNothing
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

    describe('Type validators', () => {
        it('should validate an integer', () => {
            const valid = valueOrNothing.Integer('10');
            const invalid = valueOrNothing.Integer('a10');
            expect(valid.get()).to.equals(10);
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a double', () => {
            const valid = valueOrNothing.Double('3.14');
            const invalid = valueOrNothing.Double('x3.14');
            expect(valid.get()).to.equals(3.14);
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a datetime', () => {
            const valid = valueOrNothing.DateTime('2017-05-05T10:58:13Z');
            const invalid = valueOrNothing.DateTime('2017-05-05T10:58:13A');
            expect(valid.get().toString()).to.match(/Fri May 05 2017/);
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a natural', () => {
            const valid = valueOrNothing.Natural(10);
            const invalid = valueOrNothing.Natural(-1);
            expect(valid.get()).to.equals(10);
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a char', () => {
            const valid = valueOrNothing.Char('lorem ipsum dolor sit', { length: 10 });
            expect(valid.get()).to.equal('lorem ipsu');
        });

        it('should validate an integer range', () => {
            const props = { from: 0, to: 100 };
            const valid = valueOrNothing.IntegerRange(67, props);
            const invalid = valueOrNothing.IntegerRange(143, props);
            expect(valid.get()).to.equals(67);
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a double range', () => {
            const props = { from: 0, to: 100 };
            const valid = valueOrNothing.DoubleRange(67.5, props);
            const invalid = valueOrNothing.DoubleRange(143, props);
            expect(valid.get()).to.equals(67.5);
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a money type', () => {
            const valid = valueOrNothing.Money('49,90');
            const invalid = valueOrNothing.Money('$$$ 49.90');
            expect(valid.get()).to.equals(49.9);
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a color', () => {
            const valid = valueOrNothing.Color('#333333');
            const invalid = valueOrNothing.Color('*333333');
            expect(valid.get()).to.equals('#333333');
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate an email', () => {
            const valid = valueOrNothing.Email('marcelocamargo@linuxmail.org');
            const invalid = valueOrNothing.Email('f@gggggggg~1');
            expect(valid.get()).to.equals('marcelocamargo@linuxmail.org');
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a checkbox', () => {
            const valid = valueOrNothing.Checkbox('y');
            const invalid = valueOrNothing.Checkbox('?');
            expect(valid.get()).to.be.true;
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a one-of type', () => {
            const values = ['A', 'B', 'C'];
            const valid = valueOrNothing.OneOf('A', { values });
            const invalid = valueOrNothing.OneOf('D', { values });
            expect(valid.get()).to.equals('A');
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a url', () => {
            const valid = valueOrNothing.Url('https://app.rung.com.br');
            const invalid = valueOrNothing.Url('...');
            expect(valid.get()).to.equals('https://app.rung.com.br');
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate an integer multi range', () => {
            const props = { from: 0, to: 100 };
            const valid = valueOrNothing.IntegerMultiRange('40 70', props);
            const invalid = valueOrNothing.IntegerMultiRange('-10 20', props);
            expect(valid.get()).to.deep.equals([40, 70]);
            expect(invalid.get).to.throw(TypeError);
        });

        it('should validate a calendar', () => {
            const date = 'Thu Jul 27 2017 08:55:10 GMT-0300 (BRT)';
            const workaround = 'BELIEVE IN ME, I\'M A DATE!!!';
            const valid = valueOrNothing.Calendar(date);
            const invalid = valueOrNothing.Calendar(workaround);

            const extracted = valid.get();
            expect(extracted).to.be.instanceOf(Date);
            expect(invalid.get).to.throw(TypeError);
        });

        it('should have identity for autocomplete', () => {
            expect(valueOrNothing.AutoComplete('...').get()).to.equals('...');
        });
    });

    describe('Type casting', () => {
        it('should cast a string to an integer', () => {
            const native = cast("10", Integer, 0);
            expect(native).to.equals(10);
        });

        it('should return null when there is no fallback value and it fails', () => {
            const native = cast('foo', Integer);
            expect(native).to.be.null;
        });
    })
});