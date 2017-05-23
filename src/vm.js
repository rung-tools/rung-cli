import { NodeVM } from 'vm2';
import Promise, { reject, resolve } from 'bluebird';
import {
    curry,
    has,
    pathOr,
    propOr,
    type
} from 'ramda';
import { compileHTML } from './compiler';
import { upsert, clear } from './db';

/**
 * Runs an extension on a virtualized environment and returns its result as
 * native JS data
 *
 * @author Marcelo Haskell Camargo
 * @param {String} name - The unique identifier to track the extension
 * @param {String} source - ES6 source to run
 * @return {Promise}
 */
function runInSandbox(name, source) {
    const vm = new NodeVM({
        require: {
            external: true
        },
        sandbox: {
            render: compileHTML
        }
    });

    try {
        return resolve(vm.run(source, `${name}.js`));
    } catch (err) {
        return reject(err);
    }
}

/**
 * Tries to get the parameter types by running the script to get config.params
 *
 * @author Marcelo Haskell Camargo
 * @param {Object} extension
 * @return {Promise}
 */
export function getProperties(extension) {
    return runInSandbox(extension.name, extension.source)
        .then(app => pathOr(app.config, ['default', 'config'], app));
}

/**
 * Records database if set to; otherwise, drop it
 *
 * @param {Object} result
 * @return {Promise}
 */
const updateDb = curry((name, result) => has('db', result) ? upsert(name, result.db) : clear(name));

/**
 * Runs an extension with a context (with parameters) and gets the alerts.
 * The result may be a string, a nullable value, an array...
 *
 * @author Marcelo Haskell Camargo
 * @param {Object} extension
 * @param {Object} context
 * @return {Promise}
 */
export function runAndGetAlerts(extension, context) {
    return runInSandbox(extension.name, extension.source)
        .then(app => {
            const runExtension = () => new Promise((resolve, reject) => {
                const v8function = pathOr(app.extension, ['default', 'extension'], app);

                if (type(v8function) !== 'Function') {
                    return reject(new TypeError('Expected default exported expression to be a function'));
                }

                // Async vs sync extension
                return v8function.length > 1
                    ? v8function.call(null, context, resolve)
                    : resolve(v8function.call(null, context));
            });

            return runExtension();
        })
        .tap(updateDb(extension.name));
}
