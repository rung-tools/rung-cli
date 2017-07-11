import fs from 'fs';
import { all, promisify, reject, resolve } from 'bluebird';
import {
    T,
    cond,
    curry,
    endsWith,
    fromPairs,
    map,
    merge,
    path,
    pipe,
    startsWith,
    uniq
} from 'ramda';
import { transform } from 'babel-core';
import { compileES6 } from './compiler';

const readFile = promisify(fs.readFile);

/**
 * Ensures a piece of source has no import or require declarations
 *
 * @param {String} source
 * @return {Promise}
 */
export const ensureNoImports = curry((filename, source) => {
    const { modules } = inspect(source);
    return modules.length
        ? reject(new Error(`Cannot import modules on autocomplete files (${filename})`))
        : resolve();
});

/**
 * Traverses the AST, getting the imported modules and compile to pairs
 *
 * @author Marcelo Haskel Camargo
 * @param {String} source
 * @return {Promise<String[][]>}
 */
export function compileModulesFromSource(source) {
    const { modules } = inspect(source);
    return all(modules.filter(startsWith('./')).map(compileModule));
}

/**
 * Compiles a module to a pair with (filename :: string, source :: string)
 *
 * @author Marcelo Haskell Camargo
 * @param {String} module
 * @return {Promise}
 */
function compileModule(module) {
    const extensionIs = extension => () => endsWith(extension, module);

    return readFile(module, 'utf-8')
        .then(cond([
            [extensionIs('.js'), compileES6],
            [extensionIs('.json'), pipe(JSON.parse, JSON.stringify)],
            [T, () => reject(new Error(`Unknown module loader for file ${module}`))]]))
        .then(source => [module, source]);
}

/**
 * Evaluates a list of pairs of modules. modules :: [(String, String)]
 *
 * @author Marcelo Haskell Camargo
 * @param {NodeVM} vm - Virtual machine instance to run
 * @param {String[][]} modules pairs, with (name :: string, source :: string)
 */
export const evaluateModules = (vm, modules) => fromPairs(map(([module, source]) => {
    // JSON doesn't need to run on VM. We can directly parse it
    const convertToBytecode = cond([
        [endsWith('.json'), () => JSON.parse(source)],
        [endsWith('.js'), module => vm.run(source, module)],
        [T, module => {
            throw new Error(`Unknown file type for ${module}`);
        }]
    ]);

    return [module, convertToBytecode(module)];
}, modules));

/**
 * Inspects a JS source and returns processed information, such as ES5 code,
 * the ast, source map and the used modules
 *
 * @author Marcelo Haskell Camargo
 * @param {String} source - ES6 source
 * @return {String[]}
 */
export function inspect(source) {
    const modules = [];
    const result = transform(source, {
        comments: false,
        compact: true,
        presets: ['es2015', 'react'],
        plugins: [
            ['transform-react-jsx', { pragma: '__render__' }],
            [() => ({
                visitor: {
                    ImportDeclaration({ node }) {
                        modules.push(node.source.value);
                    },
                    CallExpression({ node }) {
                        // Find and extract require(module)
                        const callee = path(['callee', 'name'], node);

                        if (callee === 'require') {
                            const [moduleNode] = node.arguments;
                            const isLiteralModule = moduleNode && moduleNode.type === 'StringLiteral';

                            if (isLiteralModule) {
                                modules.push(moduleNode.value);
                            }
                        }
                    }
                }
            })]
        ]
    });

    return merge(result, { modules: uniq(modules) });
}
