import fs from 'fs';
import { promisify, reject } from 'bluebird';
import { read } from './db';
import { getLocale, getLocaleStrings } from './i18n';
import { compileSources } from './run';
import { createVM, runInSandbox } from './vm';

export const readFile = promisify(fs.readFile);

/**
 * Creates a VM for testing purposes, with access to an `app` object containing
 * `extension` closure and `config` object.
 *
 * @param {Object} app - containing `extension` and `config`
 * @return {NodeVM}
 */
function createTestVM(app) {
    // TODO: Compile test file to ES5
    // TODO: Allow to require inner modules
    const vm = createVM();
    vm.freeze('app', app);
    return vm;
}

export default async () => {
    if (!fs.existsSync('test/index.js')) {
        return reject(new Error('no tests to run. [test/index.js] not found'));
    }

    const { name } = await readFile('package.json', 'utf-8')
        | JSON.parse;
    const strings = await getLocaleStrings();
    const [source, modules] = await compileSources();
    const vm = await runInSandbox(name, source, strings, modules)
        | createTestVM;
    const tests = await readFile('test/index.js', 'utf-8');
    const result = vm.run(tests, 'test/index.js');
    console.log(result);
};
