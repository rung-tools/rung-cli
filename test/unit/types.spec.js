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
};
