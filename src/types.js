import {
    T,
    any,
    cond,
    lte,
    prop,
    propEq,
    replace,
    split,
    take,
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
    Double: input => !isNaN(parseFloat(input)),
    Integer: input => !isNaN(parseInt(input, 10)),
    Natural: lte(0),
    Email: unary(isEmail),
    Url: unary(isURL),
    Color: isHexColor
};

export const filter = {
    Char: take,
    Double: parseFloat,
    Integer: input => parseInt(input, 10)
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
    Money: input => {
        const money = parseFloat(replace(',', '.', input));
        return isNaN(money) ? Nothing() : Just(money);
    },
    AutoComplete: Just,
    IntegerMultiRange: (input, { from, to }) => {
        const [left, right] = split(' ', input).map(item => parseInt(item, 10));
        if (any(isNaN, [left, right]) || left < from || right > to || left > right) {
            return Nothing();
        }

        return Just([left, right]);
    },
    Calendar: input => {
        // Default JS date constructor because MomentJS sucks for validation
        const date = new Date(input);
        return date.toString() === 'Invalid Date'
            ? Nothing()
            : Just(date);
    }
};
