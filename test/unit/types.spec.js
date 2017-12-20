import { expect } from 'chai';
import { map } from 'ramda';
import * as t from '../../src/types';

export default () => {
    it('should get the type name of function types', () => {
        expect([
            t.Char(8),
            t.IntegerRange(10, 20),
            t.DoubleRange(10, 20),
            t.OneOf(['Scala', 'Haskell', 'Elixir']),
            t.SelectBox({ haskell: 'Good', java: 'Bad' }),
            t.MultiSelectBox({ erlang: 'Erlang', php: 'PHP', perl: 'Perl' }),
            t.IntegerMultiRange(10, 20),
            t.Color
        ] | map(t.getTypeName)).to.deep.equals([
            'Char(8)',
            'IntegerRange(10, 20)',
            'DoubleRange(10, 20)',
            'OneOf([Scala, Haskell, Elixir])',
            'SelectBox({"haskell":"Good","java":"Bad"})',
            'MultiSelectBox({"erlang":"Erlang","php":"PHP","perl":"Perl"})',
            'IntegerMultiRange(10, 20)',
            'Color'
        ]);
    });

    it('should cover what Salete didn\'t', () => {
        expect(t.filter.Calendar(0)).to.be.instanceOf(Date);
    });

    it('should validate the types', () => {
        const v = t.validate;

        expect(v(t.IntegerRange(42, 69), 70)).to.be.false;
        expect(v(t.IntegerRange(42, 69), 50)).to.be.true;
        expect(v(t.OneOf(['Scala', 'Haskell', 'Elixir']), 'Java')).to.be.false;
        expect(v(t.OneOf(['Scala', 'Haskell', 'Elixir']), 'Elixir')).to.be.true;
        expect(v(t.OneOf(['Scala', 'Haskell', 'Elixir']), 'elIXIR')).to.be.false;
        expect(v(t.Color, '#ff0000')).to.be.true;
        expect(v(t.Color, 'ff0000')).to.be.true;
        expect(v(t.Color, 'f00')).to.be.true;
        expect(v(t.Color, '#f00')).to.be.true;
        expect(v(t.Color, 'cor de burro quando foge')).to.be.false;
        expect(v(t.Char(2), 'it fiters only')).to.be.true;
        expect(v(t.Natural, -5)).to.be.false;
        expect(v(t.Natural, 666)).to.be.true;
        expect(v(t.Email, 'foo@bar.com')).to.be.true;
        expect(v(t.Email, 'foo')).to.be.false;
        expect(v(t.String, '')).to.be.true;
        expect(v(t.String, 123)).to.be.true;
        expect(v(t.String, NaN)).to.be.true;
        expect(v(t.String, null)).to.be.true;
        expect(v(t.String, undefined)).to.be.true;
    });
};
