import { NodeVM } from 'vm2';
import Promise, { reject, resolve } from 'bluebird';
import {
    propOr,
    type
} from 'ramda';
import { compileHTML } from './compiler';
import { upsert } from './db';
import { translator } from './i18n';

/**
 * Runs an extension on a virtualized environment and returns its result as
 * native JS data
 *
 * @author Marcelo Haskell Camargo
 * @param {String} name - The unique identifier to track the extension
 * @param {String} source - ES6 source to run
 * @param {Object} strings - Object containing the strings to translate
 * @return {Promise}
 */
function runInSandbox(name, source, strings = {}) {
    const vm = new NodeVM({
        require: {
            external: true
        },
        sandbox: {
            __render__: compileHTML,
            _: translator(strings)
        }
    });

    try {
        const result = vm.run(source, `${name}.js`);
        return resolve(propOr(result, 'default', result));
    } catch (err) {
        return reject(err);
    }
}

/**
 * Tries to get the parameter types by running the script to get config.params
 *
 * @author Marcelo Haskell Camargo
 * @param {Object} extension - Must contain name and source
 * @param {Object} strings - Object with strings to translate
 * @return {Promise}
 */
export function getProperties(extension, strings) {
    return runInSandbox(extension.name, extension.source, strings)
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
 * @return {Promise}
 */
export function runAndGetAlerts(extension, context, strings) {
    return runInSandbox(extension.name, extension.source, strings)
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
