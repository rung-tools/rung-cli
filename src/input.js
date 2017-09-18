import Promise, { resolve } from 'bluebird';
import {
    T,
    __,
    assoc,
    concat,
    cond,
    curry,
    has,
    keys,
    map,
    merge,
    reduce,
    toPairs
} from 'ramda';
import { green, red, yellow } from 'colors/safe';
import { createPromptModule } from 'inquirer';
import DatePickerPrompt from 'inquirer-datepicker-prompt';
import ChalkPipe from 'inquirer-chalk-pipe';
import AutocompletePrompt from 'inquirer-autocomplete-prompt';
import { validator, filter } from './types';
import getAutocompleteSources, { stdlib, stringToClosure } from './autocomplete';

/**
 * Emits a warning to stdout
 *
 * @param {String} message
 * @return {Promise}
 */
export const emitWarning = concat(' ⚠ Warning: ') & yellow & console.log & resolve;

/**
 * Emits an error to stdout
 *
 * @param {String} message
 * @return {Promise}
 */
export const emitError = concat(' ✗ Error: ') & red & console.log & resolve;

/**
 * Emits a success message
 *
 * @param {String} message
 * @return {Promise}
 */
export const emitSuccess = concat(' ✔ Success: ') & green & console.log & resolve;

/**
 * Renames the keys of an object
 *
 * @sig {a: b} -> {a: *} -> {b: *}
 */
const renameKeys = curry((keysMap, obj) => reduce((acc, key) =>
    assoc(keysMap[key] || key, obj[key], acc), {}, keys(obj)));

const components = {
    Calendar: ~({
        type: 'datetime',
        format: ['m', '/', 'd', '/', 'yy'],
        filter: filter.Calendar }),
    Char: ({ type }) => ({ filter: filter.Char(type.length) }),
    Checkbox: ~({ type: 'confirm' }),
    Color: ~({ type: 'chalk-pipe' }),
    DoubleRange: ({ type }) => ({
        filter: filter.Double,
        validate: validator.Range(type.from, type.to) }),
    DateTime: ~({ type: 'datetime' }),
    Double: ~({ validate: validator.Double, filter: filter.Double }),
    Email: ~({ validate: validator.Email }),
    Integer: ~({ validate: validator.Integer, filter: filter.Integer }),
    IntegerRange: ({ type }) => ({
        filter: filter.Integer,
        validate: validator.Range(type.from, type.to) }),
    IntegerMultiRange: ({ type }) => ({
        filter: filter.IntegerMultiRange,
        validate: validator.IntegerMultiRange(type.from, type.to) }),
    Natural: ~({ validate: validator.Natural, filter: filter.Integer }),
    OneOf: ({ type }) => ({ type: 'list', choices: type.values }),
    String: ~({ type: 'input' }),
    Url: ~({ validate: validator.Url }),
    Money: ~({ validate: validator.Money, filter: filter.Money }),
    SelectBox: ({ type }) => ({
        type: 'list',
        choices: type.values
            | toPairs
            | map(([value, name]) => ({ name, value })) })
};

/**
 * Custom autocomplete component
 *
 * @param {String} name
 * @param {String} source
 * @return {Function}
 */
const getAutocompleteComponent = (name, source) => {
    // TODO:
    // - Deal with rejections of promise
    // - Better debugging for autocomplete
    // - Error when it doesn't export a function
    //
    if (!source) {
        emitWarning(`missing autocomplete source for parameter \`${name}'`);
    }

    const closure = stringToClosure(source);
    return ~({
        type: 'autocomplete',
        source: (params, input) => new Promise(closure({
            params, input, lib: stdlib, c: console }, _))
    });
};

/**
 * Converts a Rung CLI question object to an Inquirer question object
 *
 * @author Marcelo Haskell Camargo
 * @param {String} name
 * @param {Object} config
 * @return {Object}
 */
const toInquirerQuestion = curry((sources, [name, config]) => {
    const component = components
        | cond([
            [~(config.type.name === 'AutoComplete'), ~getAutocompleteComponent(name, sources[name])],
            [has(config.type.name), _[config.type.name]],
            [T, _.String]
        ]);

    return merge(config
        | renameKeys({ description: 'message' })
        | merge(__, { name }), component(config));
});

/**
 * Returns the pure JS values from received questions that will be answered
 *
 * @author Marcelo Haskell Camargo
 * @param {Object} questions
 * @return {Promise} answers for the questions by key
 */
export function ask(questions) {
    const prompt = createPromptModule();
    prompt.registerPrompt('datetime', DatePickerPrompt);
    prompt.registerPrompt('chalk-pipe', ChalkPipe);
    prompt.registerPrompt('autocomplete', AutocompletePrompt);
    // Read the autocomplete folder to hold their sources in the memory
    return getAutocompleteSources()
        .then(sources => prompt(questions
            | toPairs
            | map(toInquirerQuestion(sources))));
}
