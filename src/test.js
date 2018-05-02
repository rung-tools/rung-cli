import fs from 'fs';
import { all, promisify, reject } from 'bluebird';
import {
    concat,
    cond,
    drop,
    either,
    filter,
    map,
    startsWith
} from 'ramda';
import { compileES6 } from './compiler';
import { read } from './db';
import { getLocale, getLocaleStrings } from './i18n';
import { compileModule, compileModulesFromSource, evaluateModules, inspect } from './module';
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

/**
 * If possible, run the tests. Compile the tests to ES5 and the app sources to
 * V8 objects, then run the tests in the VM linking the compiled object to it.
 *
 * @return {Promise}
 */
export default () => compileApp()
    .then(async app => {
        const test = await readFile('test/index.js', 'utf-8')
            | compileES6;
        const modules = await (inspect(test).modules
            | filter(either(startsWith('./'), startsWith('../')))
            | map(cond([
                [startsWith('./'), drop(2) & concat('./test/')],
                [startsWith('../'), drop(1)]
            ]))
            | map(compileModule)
            | all);

        console.log(modules);
    });
    /*
     * all([compileTests(), compileApp()])
    .spread(async (test, app) => {
        // Make `app` available to the tests
        test.vm.freeze(app, 'app');
        test.vm.options.require.mock = evaluateModules(test.vm, test.modules);
    });
    */
