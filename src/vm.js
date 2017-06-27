import { NodeVM } from 'vm2';
import Promise, { reject, resolve } from 'bluebird';
import {
    propOr,
    tryCatch,
    type
} from 'ramda';
import { compileHTML } from './compiler';
import { upsert } from './db';
import { translator } from './i18n';
import { evaluateModules } from './module';

/**
 * Returns an instance of the Rung virtual machine
 *
 * @author Marcelo Haskell Camargo
 * @param {Object} translator - Map of strings to translate
 * @return {NodeVM}
 */
function createVM(strings) {
    const vm = new NodeVM({
        require: {
            external: true
        }
    });

    vm.freeze(compileHTML, '__render__');
    vm.freeze(translator(strings), '_');

    return vm;
}

/**
 * Runs an extension on a virtualized environment and returns its result as
 * native JS data
 *
 * @author Marcelo Haskell Camargo
 * @param {String} name - The unique identifier to track the extension
 * @param {String} source - ES6 source to run
 * @param {Object} strings - Object containing the strings to translate
 * @param {String[][]} modules - Map of modules with [filename, source]
 * @return {Promise}
 */
function runInSandbox(name, source, strings = {}, modules = []) {
    const evaluate = tryCatch(() => {
        const vm = createVM(strings);

        // Pre-evaluate and inject in vm all necessary modules
        vm.options.require.mock = evaluateModules(vm, modules);

        // Run with all modules! :)
        const result = vm.run(source, `${name}.js`);
        return resolve(propOr(result, 'default', result));
    }, reject);

    return evaluate();
}

/**
 * Tries to get the parameter types by running the script to get config.params
 *
 * @author Marcelo Haskell Camargo
 * @param {Object} extension - Must contain name and source
 * @param {Object} strings - Object with strings to translate
 * @param {String[][]} modules - Object with modules name and source
 * @return {Promise}
 */
export function getProperties(extension, strings, modules) {
    return runInSandbox(extension.name, extension.source, strings, modules)
        .then(propOr({}, 'config'));
}

/**
 * Runs an extension with a context (with parameters) and gets the alerts.
 * The result may be a string, a nullable value, an array...
 *
 * @author Marcelo Haskell Camargo
 * @param {Object} extension - Object containing name and source
 * @param {Object} context - Context to pass to the main function
 * @param {Object} strings - Object with strings to translate
 * @param {String[][]} modules - Modules with [filename, source]
 * @return {Promise}
 */
export function runAndGetAlerts(extension, context, strings, modules) {
    return runInSandbox(extension.name, extension.source, strings, modules)
        .then(app => {
            const runExtension = () => new Promise((resolve, reject) => {
                if (type(app.extension) !== 'Function') {
                    return reject(new TypeError('Expected default exported expression to be a function'));
                }

                // Async vs sync extension
                return app.extension.length > 1
                    ? app.extension.call(null, context, resolve)
                    : resolve(app.extension.call(null, context));
            });

            return runExtension();
        })
        .tap(result => upsert(extension.name, result.db));
}
