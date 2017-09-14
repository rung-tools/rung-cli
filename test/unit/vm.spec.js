import { expect } from 'chai';
import { getProperties, runAndGetAlerts } from '../../src/vm';

export default () => {
    describe('Virtual machine runtime', () => {
        it('should get the config of an extension', () => {
            const source = `module.exports = { default:
                { extension: () => {}, config: { primaryKey: true } }
            }`;

            return getProperties({ name: 'test-config', source })
                .then(result => {
                    void expect(result).property('primaryKey').to.be.true;
                });
        });

        it('should get the alerts of a synchronous extension', () => {
            const source = 'module.exports = { extension: ctx => ([\'Hello \' + ctx.name]) };';

            return runAndGetAlerts({ name: 'test-alerts', source }, { name: 'Marcelo' })
                .then(alerts => {
                    expect(alerts).to.be.an('array');
                    expect(alerts).property(0).to.be.equals('Hello, Marcelo!');
                });
        });

        it('should get the alerts of a asynchronous extension', () => {
            const source = `
                const { delay } = require('bluebird');

                // Export extension
                module.exports = {
                    extension: (ctx, done) => {
                        console.log('start');
                        delay(200).then(() => {
                            done(['It works!']);
                        });
                    }
                };
            `;

            return runAndGetAlerts({ name: 'test-async-alerts', source }, {})
                .then(alerts => {
                    expect(alerts).to.be.an('array');
                });
        });
    });

    describe('Virtual machine security', () => {
        it('should not allow process.exit', () => {
            const source = `
                module.exports = {
                    extension: function(context) {
                        this.constructor.constructor('return process')().exit();
                        return {};
                    }
                };
            `;

            return runAndGetAlerts({ name: 'test-process-exit', source }, {})
                .then(() => {
                    throw new Error('Should not fall here');
                })
                .catch(err => {
                    expect(err).to.be.an.instanceOf(TypeError);
                });
        });

        it('should not allow file system access', () => {
            const source = `
                const fs = require('fs');

                module.exports = {
                    extension: () => {
                        console.log(fs);
                    }
                };
            `;

            return runAndGetAlerts({ name: 'test-filesystem-access', source }, {})
                .then(() => {
                    throw new Error('Should not fall here');
                })
                .catch(err => {
                    expect(err.message).to.match(/Access denied to require/);
                });
        });

        it('should refuse extension when it is not a function', () => {
            const source = `
                module.exports = {
                    extension: 1
                };
            `;

            return runAndGetAlerts({ name: 'test-ext-type', source }, {})
                .then(() => {
                    throw new Error('Should not fall here');
                })
                .catch(err => {
                    expect(err.message).to.match(/Expected default exported expression to be a function/);
                });
        });
    });
};
