import { expect } from 'chai';
import { dec, equals, ifElse, last, unary } from 'ramda';
import * as t from '../../src/types';
import work, { addAfter, keepCalm, keyboard, removeChunk } from './salete';

const { type, press } = keyboard;
const run = does => ({
    runs: ['node', '../dist/cli.js', 'run', '--raw'],
    does
});

/**
 * Makes Salete code the component on index.js and run.
 * The default line for parameters is 18
 *
 * @param {Object} component - Component to run
 * @param {Number} from - Starting line to remove/replace
 * @param {Number} upTo - Final line to remove/replace
 */
const saleteWillCode = (component, from = 18, upTo) => removeChunk('index.js', from, upTo)
    .then(~addAfter('index.js', from - 1, `const params = ${JSON.stringify(component)}`));

export default () => {
    before(() => {
        process.chdir('salete-hello-world');
        // Remove line with import from types
        return removeChunk('index.js', 2)
            .then(~removeChunk('index.js', 4))
            .then(~addAfter('index.js', 3, `return "Got: " + JSON.stringify(name);`));
    });

    it('should use integer component', () => {
        const component = {
            name: {
                type: t.Integer,
                description: 'Give me a number'
            }
        };

        return saleteWillCode(component, 18, 6)
            .then(~work(run([
                type('abc'), press.ENTER,
                type('-10.3'), press.ENTER,
                keepCalm(15)
            ])))
            .then(output => {
                expect(output).to.contain('Got: -10');
            });
    }).timeout(keepCalm(30));

    it('should use the double component', () => {
        const component = {
            name: {
                type: t.Double,
                description: 'Give me a double'
            }
        };

        return saleteWillCode(component)
            .then(~work(run([
                type('20.5'), press.ENTER,
                keepCalm(15)
            ])))
            .then(output => {
                expect(output).to.contain('Got: 20.5');
            });
    }).timeout(keepCalm(30));

    it('should use the datetime component', () => {
        const component = {
            name: {
                type: t.DateTime,
                description: 'Give me a datetime'
            }
        };

        return saleteWillCode(component)
            .then(~work(run([
                keepCalm(0.5), press.UP, press.ENTER,
                keepCalm(15)
            ])))
            .then(output => {
                // Salete pressed up in the month, so the current month should
                // be the returned month - 1
                const expectedCurrentMonth = output.match(/Got: "\d{4}-(\d{2})/m)
                    | last
                    | unary(parseInt)
                    | ifElse(equals(1), ~12, dec);
                const now = new Date().getMonth() + 1;
                expect(expectedCurrentMonth).to.equals(now);
            });
    }).timeout(keepCalm(30));

    after(~process.chdir('..'));
};
