import {
    T,
    any,
    cond,
    contains,
    prop,
    propEq,
    replace,
    split,
    take
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

// Type validators
export const valueOrNothing = {
    Integer: input => {
        const intValue = parseInt(input, 10);
        return isNaN(intValue) ? Nothing() : Just(intValue);
    },
    Double: input => {
        const doubleValue = parseFloat(input);
        return isNaN(doubleValue) ? Nothing() : Just(doubleValue);
    },
    DateTime: input => {
        const date = new Date(input);
        return isNaN(date.getMilliseconds()) ? Nothing() : Just(date);
    },
    Natural: input => {
        const intValue = parseInt(input, 10);
        return isNaN(intValue) || intValue < 0 ? Nothing() : Just(intValue);
    },
    Char: (input, { length }) => {
        return Just(take(length, input));
    },
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
    String: Just,
    AutoComplete: Just,
    Color: input => isHexColor(input) ? Just(input) : Nothing(),
    Email: input => isEmail(input) ? Just(input) : Nothing(),
    Checkbox: input => {
        const lowerCaseInput = input.toLowerCase();
        return contains(lowerCaseInput, ['y', 'n']) ? Just(lowerCaseInput === 'y') : Nothing();
    },
    OneOf: (input, { values }) => contains(input, values) ? Just(input) : Nothing(),
    Url: input => isURL(input) ? Just(input) : Nothing(),
    IntegerMultiRange: (input, { from, to }) => {
        const [left, right] = split(' ', input).map(item => parseInt(item, 10));
        if (any(isNaN, [left, right]) || left < from || right > to || left > right) {
            return Nothing();
        }

        return Just([left, right]);
    },
    Date: input => {
        // Default JS date constructor because MomentJS sucks for validation
        const date = new Date(input);
        return date.toString() === 'Invalid Date'
            ? Nothing()
            : Just(date);
    }
};

/**
 * Returns the literal value by receiving the string input, the type and the
 * default value
 *
 * @author Marcelo Haskell Camargo
 * @param {String} input - The original string value
 * @param {Object} type - Type of the value to be casted
 * @param {Mixed} def - The value that may be taken in case of error. Null on error
 */
export const cast = (input, type) =>
    valueOrNothing[type.name](input, type).getOrElse(null);
