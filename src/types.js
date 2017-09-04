import {
    T,
    any,
    complement,
    cond,
    lte,
    prop,
    propEq,
    replace,
    split,
    take,
    tryCatch,
    unary
} from 'ramda';
import { Just, Nothing } from 'data.maybe';
import { isEmail, isHexColor, isURL } from 'validator';

export const Integer = { name: 'Integer' };
export const Double = { name: 'Double' };
export const DateTime = { name: 'DateTime' };
export const Natural = { name: 'Natural' };
export const Char = length => ({ name: 'Char', length });
export const IntegerRange = (from, to) => ({ name: 'IntegerRange', from, to });
export const DoubleRange = (from, to) => ({ name: 'DoubleRange', from, to });
export const Money = { name: 'Money' };
export const String = { name: 'String' };
export const Color = { name: 'Color' };
export const Email = { name: 'Email' };
export const Checkbox = { name: 'Checkbox' };
export const OneOf = values => ({ name: 'OneOf', values });
export const Url = { name: 'Url' };
export const IntegerMultiRange = (from, to) => ({ name: 'IntegerMultiRange', from, to });
export const Calendar = { name: 'Calendar' };
export const AutoComplete = { name: 'AutoComplete' };
export const Location = { name: 'Location' };

/**
 * Returns the human-readable name of a type
 *
 * @author Marcelo Haskell Camargo
 * @param {String} type {anonymous}
 * @return {String} {anonymous}
 */
export const getTypeName = cond([
    [propEq('name', 'Char'), t => `Char(${t.length})`],
    [propEq('name', 'IntegerRange'), t => `IntegerRange(${t.from}, ${t.to})`],
    [propEq('name', 'DoubleRange'), t => `DoubleRange(${t.from}, ${t.to})`],
    [propEq('name', 'OneOf'), t => `OneOf([${t.values.join(', ')}])`],
    [T, prop('name')]
]);

export const validator = {
    Calendar: String & equals('Invalid Date'),
    Color: isHexColor,
    Double: complement(isNaN),
    Email: unary(isEmail),
    Integer: complement(isNaN),
    Money: complement(isNaN),
    Natural: lte(0),
    Url: unary(isURL)
};

export const filter = {
    Calendar: date => new Date(date),
    Char: take,
    Double: parseFloat,
    Integer: parseInt(_, 10),
    Money: tryCatch(replace(',', '.') & parseFloat, ~NaN)
};

// Type validators
export const valueOrNothing = {
    IntegerRange: (input, { from, to }) => {
        const intValue = parseInt(input, 10);
        return isNaN(intValue) || intValue < from || intValue > to ? Nothing() : Just(intValue);
    },
    DoubleRange: (input, { from, to }) => {
        const doubleValue = parseFloat(input);
        return isNaN(doubleValue) || doubleValue < from || doubleValue > to ? Nothing() : Just(doubleValue);
    },
    AutoComplete: Just,
    IntegerMultiRange: (input, { from, to }) => {
        const [left, right] = split(' ', input).map(item => parseInt(item, 10));
        if (any(isNaN, [left, right]) || left < from || right > to || left > right) {
            return Nothing();
        }

        return Just([left, right]);
    }
};
