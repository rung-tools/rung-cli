import readline from 'readline';
import { resolve, promisify } from 'bluebird';
import {
    __,
    assoc,
    curry,
    has,
    is,
    keys,
    map,
    merge,
    reduce,
    toPairs
} from 'ramda';
import { green, red, yellow } from 'colors/safe';
import read from 'read';
import { createPromptModule } from 'inquirer';
import DatePickerPrompt from 'inquirer-datepicker-prompt';
import { cast, validator, filter } from './types';

/**
 * Emits a warning to stdout
 *
 * @param {String} message
 * @return {Promise}
 */
export function emitWarning(message) {
    console.log(yellow(` ⚠ Warning: ${message}`));
    return resolve();
}

/**
 * Emits an error to stdout
 *
 * @param {String} message
 * @return {Promise}
 */
export function emitError(message) {
    console.log(red(` ✗ Error: ${message}`));
    return resolve();
}

/**
 * Emits a success message
 *
 * @param {String} message
 * @return {Promise}
 */
export function emitSuccess(message) {
    console.log(green(` ✔ Success: ${message}`));
    return resolve();
}

/**
 * Returns an IO object that promisifies everything that is necessary and exposes
 * a clear API
 *
 * @author Marcelo Haskell Camargo
 * @return {Object}
 */
export function IO() {
    const io = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return {
        read: promisify((text, callback) => {
            io.question(`${text}: `, callback.bind(null, null));
        }),
        close: io.close.bind(io),
        password: promisify((text, callback) => {
            io.close();
            read({ prompt: `${text}: `, silent: true, replace: '*' }, callback);
        })
    };
}

/**
 * Returns the resolved value, based on required properties and default values
 *
 * @param {String} text
 * @param {Object} type
 * @param {Mixed} def
 * @param {Boolean} required
 */
export function resolveValue(text, type, def, required) {
    if (required && text.trim() === '') {
        return null;
    }

    const nativeValue = cast(text, type);
    const isEmptyString = value => is(String, value) && value.trim() === '';

    return nativeValue === null || isEmptyString(nativeValue) ? def : nativeValue;
}

/**
 * Renames the keys of an object
 *
 * @sig {a: b} -> {a: *} -> {b: *}
 */
const renameKeys = curry((keysMap, obj) => reduce((acc, key) =>
    assoc(keysMap[key] || key, obj[key], acc), {}, keys(obj)));

const components = {
    Calendar: () => ({ type: 'datetime', format: ['m', '/', 'd', '/', 'yy'] }),
    Char: ({ type }) => ({ type: 'input', filter: filter.Char(type.length) }),
    Checkbox: () => ({ type: 'confirm' }),
    Color: () => ({ type: 'input', validate: validator.Color }),
    DateTime: () => ({ type: 'datetime' }),
    Double: () => ({ type: 'input', validate: validator.Double, filter: filter.Double }),
    Email: () => ({ type: 'input', validate: validator.Email }),
    Integer: () => ({ type: 'input', validate: validator.Integer, filter: filter.Integer }),
    Natural: () => ({ type: 'input', validate: validator.Natural, filter: filter.Integer }),
    OneOf: ({ type }) => ({ type: 'list', choices: type.values }),
    String: () => ({ type: 'input' }),
    Url: () => ({ type: 'input', validate: validator.Url })
};

/**
 * Converts a Rung CLI question object to an Inquirer question object
 *
 * @author Marcelo Haskell Camargo
 * @param {String} name
 * @param {Object} config
 * @return {Object}
 */
function toInquirerQuestion([name, config]) {
    const component = has(config.type.name, components)
        ? components[config.type.name]
        : components.String;

    return merge(config
        | renameKeys({ description: 'message' })
        | merge(__, { name }), component(config));
}

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
    return resolve(prompt(questions | toPairs | map(toInquirerQuestion)))
        .tap(console.log);
}
