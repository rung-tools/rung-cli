import dasherize from 'dasherize';
import {
    __,
    contains,
    equals,
    ifElse,
    join,
    map,
    toPairs,
    type,
    unary,
    when
} from 'ramda';
import { transform } from 'babel-core';

/**
 * Generates CSS string from an object
 *
 * @param {Object} obj
 * @return {String}
 */
const compileCSS = toPairs
    & map(([key, value]) => `${dasherize(key)}:${value}`)
    & join(';')
    & JSON.stringify;

/**
 * Generates HTML string for element properties
 *
 * @param {Object} props
 * @return {String}
 */
function compileProps(props) {
    const transformKey = when(equals('className'), ~'class');
    const transformValue = ifElse(type & equals('Object'),
        compileCSS, unary(JSON.stringify));

    const result = props
        | toPairs
        | map(([key, value]) => `${transformKey(key)}=${transformValue(value)}`)
        | join(' ');

    return result.length === 0 ? '' : ` ${result}`;
}

/**
 * Compiles a self-closing tag, dealing with elements that may or not be
 * self-closing
 *
 * @param {String} tag - JSX component name
 * @param {Object} props - Element properties
 */
function compileSelfClosingTag(tag, props) {
    const compiledProps = compileProps(props);

    return contains(tag, ['br', 'hr', 'img'])
        ? `<${tag}${compiledProps} />`
        : `<${tag}${compiledProps}></${tag}>`;
}

/**
 * Generates HTML source code directly from JSX
 *
 * @param {String} tag - JSX component name
 * @param {Object} props - Element properties
 * @param {Array} children - Items to append to inner component
 * @return {String}
 */
export function compileHTML(tag, props, ...children) {
    const filteredTag = tag | when(contains(__, ['style', 'script']), ~'span');
    const render = when(type & equals('Array'), join(''));
    return children.length === 0
        ? compileSelfClosingTag(filteredTag, props)
        : `<${filteredTag}${compileProps(props)}>${children.map(render).join('')}</${filteredTag}>`;
}

/**
 * Precompiles ES6 source to ES5 in order to keep retrocompatibily
 *
 * @author Marcelo Haskell Camargo
 * @param {String} source
 * @param {String} property - code, map or ast
 * @return {Promise}
 */
export function compileES6(source) {
    const result = transform(source, {
        comments: false,
        compact: true,
        presets: ['es2015', 'react'],
        plugins: [
            ['transform-react-jsx', { pragma: '__render__' }]
        ]
    });

    return result.code;
}
