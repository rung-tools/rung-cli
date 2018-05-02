import fs from 'fs';
import Promise, { promisify, reject } from 'bluebird';
import {
    either,
    filter,
    ifElse,
    lt,
    startsWith
} from 'ramda';
import { compileES6 } from './compiler';
import { getLocaleStrings } from './i18n';
import { emitError, emitInfo, emitSuccess } from './input';
import { inspect } from './module';
import { compileSources } from './run';
import { createVM, runInSandbox } from './vm';

export const readFile = promisify(fs.readFile);

/**
 * Compiles the app files and returns an instance of a V8 object.
 *
 * @return {Promise}
 */
async function compileApp() {
    const { name } = await readFile('package.json', 'utf-8')
        | JSON.parse;
    const [source, modules] = await compileSources();
    const strings = await getLocaleStrings();
    return runInSandbox(name, source, strings, modules);
}

function runTests(tests, failed = 0) {
    if (tests.length === 0) {
        return failed;
    }

    const [[description, implementation], ...rest] = tests;

    // Synchronous extension
    if (implementation.length === 0) {
        try {
            implementation();
            return emitSuccess(description)
                .then(~runTests(rest, failed));
        } catch (err) {
            return emitError(`${description}\n${err.message}\n${err.stack}`)
                .then(~runTests(rest, failed + 1));
        }
    }

    // Asynchronous extension, callback parameter
    return new Promise(resolve => {
        console.log('rodano');
    });
}

/**
 * If possible, run the tests. Compile the tests to ES5 and the app sources to
 * V8 objects, then run the tests in the VM linking the compiled object to it.
 *
 * @return {Promise}
 */
export default () => compileApp()
    .then(async app => {
        const source = await readFile('test/index.js', 'utf-8')
            | compileES6;
        const localTestModules = inspect(source).modules
            | filter(either(startsWith('./'), startsWith('../')));

        if (localTestModules.length > 0) {
            return reject(new Error('Only external modules can be required in testsuite. Found '
                + localTestModules.join(', ')));
        }

        // Compile test cases to V8 safe closures
        const results = [];
        const vm = createVM();
        const test = (description, implementation) => {
            results.push([description, implementation]);
        };
        vm.freeze(app, 'app');
        vm.freeze(test, 'test');
        vm.run(source, 'test/index.js');

        return emitInfo(`${results.length} test case(s) found`)
            .then(~runTests(results))
            .then(ifElse(lt(0),
                (failures => reject(new Error(`${failures} test(s) failing`))),
                ~emitSuccess('Done!')));
    });
