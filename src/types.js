import {
    T,
    __,
    all,
    allPass,
    applyTo,
    clamp,
    complement,
    cond,
    contains,
    curry,
    equals,
    evolve,
    flip,
    gte,
    identity,
    is,
    length,
    lte,
    map,
    none,
    propEq,
    propOr,
    replace,
    split,
    take,
    tryCatch,
    unary,
    unless,
    values
} from 'ramda';
import { isEmail, isHexColor, isURL } from 'validator';
import { components } from './input';

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
export const SelectBox = values => ({ name: 'SelectBox', values });
export const MultiSelectBox = values => ({ name: 'MultiSelectBox', values });
export const File = ({ name: 'File' });

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
    [propEq('name', 'SelectBox'), t => `SelectBox(${JSON.stringify(t.values)})`],
    [propEq('name', 'IntegerMultiRange'), t => `IntegerMultiRange(${t.from}, ${t.to})`],
    [propEq('name', 'MultiSelectBox'), t => `MultiSelectBox(${JSON.stringify(t.values)})`],
    [T, _.name]
]);

export const validator = {
    Color: isHexColor,
    Double: complement(isNaN),
    Email: unary(isEmail),
    Integer: complement(isNaN),
    IntegerMultiRange: (from, to) => allPass([
        length & equals(2),
        none(isNaN),
        evolve([gte(__, from), lte(__, to)]) & values & all(identity)]),
    Money: complement(isNaN),
    Natural: lte(0),
    OneOf: flip(contains),
    Range: (from, to) => clamp(from, to, _) === _,
    Url: unary(isURL)
};

export const validate = curry((type, value) =>
    propOr(~{}, type.name, components)
        | applyTo(type)
        | propOr(~true, 'validate')
        | applyTo(value));

export const filter = {
    Calendar: date => new Date(date),
    Char: take,
    Double: parseFloat,
    Integer: parseInt(_, 10),
    IntegerMultiRange: unless(is(Array), split(' ') & map(parseInt(_, 10))),
    Money: tryCatch(replace(',', '.') & parseFloat, ~NaN)
};
