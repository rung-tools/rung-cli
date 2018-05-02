import fs from 'fs';
import { all, promisify, reject } from 'bluebird';
import { compileES6 } from './compiler';
import { read } from './db';
import { getLocale, getLocaleStrings } from './i18n';
import { compileModulesFromSource, evaluateModules } from './module';
import { compileSources } from './run';
import { createVM, runInSandbox } from './vm';

export const readFile = promisify(fs.readFile);

/**
 * Compiles the test file, links required modules and returns an instance of
 * a virtual machine to run them.
 *
 * @return {Promise}
 */
async function compileTests() {
    const source = await readFile('test/index.js', 'utf-8')
        | compileES6;
    const modules = await compileModulesFromSource(source);
    const vm = createVM();
    return { vm, source, modules };
}

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

/**
 * If possible, run the tests. Compile the tests to ES5 and the app sources to
 * V8 objects, then run the tests in the VM linking the compiled object to it.
 *
 * @return {Promise}
 */
export default () => all([compileTests(), compileApp()])
    .spread(async (test, app) => {
        // Make `app` available to the tests
        test.vm.freeze(app, 'app');
        test.vm.options.require.mock = evaluateModules(test.vm, test.modules);
    });
