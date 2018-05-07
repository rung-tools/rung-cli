import fs from 'fs';
import { all, promisify, reject, resolve } from 'bluebird';
import {
    either,
    evolve,
    filter,
    inc,
    startsWith,
    tryCatch
} from 'ramda';
import { compileES6 } from './compiler';
import { getLocaleStrings } from './i18n';
import { emitError, emitInfo, emitSuccess } from './input';
import { inspect } from './module';
import { compileSources } from './run';
import { createVM, runAndGetAlerts } from './vm';

const readFile = promisify(fs.readFile);

/**
 * Compiles the app files and returns an instance of a V8 object.
 *
 * @return {Promise<Object => Promise>}
 */
async function compileApp() {
    const { name } = await readFile('package.json', 'utf-8')
        | JSON.parse;
    const [source, modules] = await compileSources();
    const strings = await getLocaleStrings();
    return context =>
        runAndGetAlerts({ name, source }, context, strings, modules);
}

/**
 * Compiles the test source.
 *
 * @return {Promise}
 */
async function compileTest() {
    const source = await readFile('test/index.js', 'utf-8')
        | compileES6;
    const localTestModules = inspect(source).modules
        | filter(either(startsWith('./'), startsWith('../')));

    if (localTestModules.length > 0) {
        return reject(new Error('Only external modules can be required in testsuite. Found '
            + localTestModules.join(', ')));
    }

    return source;
}

/**
 * Executes the tests and returns a promise with computed results.
 * @param {Object => Promise} runWithContext - Pre-compiled application
 * @param {(String, Function)[]} tests - The test cases
 * @return {Promise}
 */
async function runTests(runWithContext, tests) {
    if (tests.length === 0) {
        return emitInfo('No tests to run');
    }

    const loop = async ([test, ...rest], report = { passing: 0, failing: 0 }) => {
        if (!test) {
            const message = `${report.passing} passing, ${report.failing} failing`;
            if (report.failing > 0) {
                return reject(new Error(message));
            }

            return emitSuccess(message);
        }

        const [description, implementation] = test;
        return runWithContext
            | tryCatch(implementation & resolve, reject)
            | (future => future
                .then(~emitSuccess(description)
                    .return(report | evolve({ passing: inc })))
                .catch(err =>
                    emitError(`${description}:\n${err.stack}\n`)
                        .return(report | evolve({ failing: inc })))
                .then(loop(rest, _)));
    };

    await emitInfo(`${tests.length} test case(s) found`);
    return loop(tests);
}

/**
 * If possible, run the tests. Compile the tests to ES5 and the app sources to
 * V8 objects, then run the tests in the VM linking the compiled object to it.
 *
 * @return {Promise}
 */
export default async () => {
    const [source, runWithContext] = await all([compileTest(), compileApp()]);
    const tests = [];
    const vm = createVM();
    const test = (...args) => tests.push(args);
    vm.freeze(test, 'test');
    vm.run(source, 'test/index.js');
    return runTests(runWithContext, tests);
};
