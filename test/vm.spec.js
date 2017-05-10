import { expect } from 'chai';
import { __require, getProperties, runAndGetAlerts } from '../src/vm';

describe('vm.js', () => {
    describe('Module system', () => {
        it('should allow a module in whitelist to be required', () => {
            const lib = __require(['rung-sdk', 'moment'], 'moment');
            expect(lib).to.be.an('function');
        });

        it('should forbid a module that is not whitelisted to be required', () => {
            expect(() => {
                const lib = __require(['rung-sdk', 'moment'], 'fs');
            }).to.throw(/Disallowed dependency/);
        });
    });

    describe('Virtual machine runtime', () => {
        it('should get the config of an extension', () => {
            const source = 'module.exports = { extension: () => {}, config: { primaryKey: true } };';

            return getProperties({ name: 'test-config', source })
                .then(result => {
                    expect(result).property('primaryKey').to.be.true;
                });
        });

        it('should get the alerts of a synchronous extension', () => {
            const source = 'module.exports = { extension: ctx => ([`Hello, ${ctx.name}!`]) };'

            return runAndGetAlerts({ name: 'test-alerts', source }, { name: 'Marcelo' })
                .then(alerts => {
                    expect(alerts).to.be.an('array');
                    expect(alerts).property(0).to.be.equals('Hello, Marcelo!');
                });
        });

        it('should get the alerts of a asynchronous extension', () => {
            const source = `
                const delay = require('bluebird').delay;

                module.exports = {
                    extension: (ctx, done) => {
                        console.log('start');
                        delay(200).then(() => {
                            done(['It works!']);
                        });
                    }
                };
            `;

            return runAndGetAlerts({ name: 'test-alerts', source }, { name: 'Marcelo' })
                .then(alerts => {
                    expect(alerts).to.be.an('array');
                });
        });
    })
});