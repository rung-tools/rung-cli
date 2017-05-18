import os from 'os';
import path from 'path';
import chai, { expect } from 'chai';
import { promisify } from 'bluebird';
import rimraf from 'rimraf';
import fs from 'chai-fs';
import { runAndGetAlerts } from '../src/vm';
import { compileES6 } from '../src/compiler';
import { read } from '../src/db';
import { createStream } from './helper';

chai.use(fs);

const rm = promisify(rimraf);
const home = os.homedir();
const extensionName = 'rung-database-test';
const dbPath = path.join(home, '.rung', `${extensionName}.db`);

describe('db.js', () => {
    before(() => rm(dbPath));

    describe('Database', () => {
        it('should get undefined when reading from empty db', () => {
            return read(extensionName)
                .then(result => {
                    expect(result).to.equals(undefined);
                });
        });

        it('should store an object in the database', () => {
            const source = compileES6(`
                export default {
                    extension(context) {
                        return {
                            alerts: {},
                            db: { counter: 1 }
                        };
                    }
                };
            `);

            return runAndGetAlerts({ name: extensionName, source }, {})
                .then(result => {
                    expect(result.db.counter).to.equals(1);
                    expect(dbPath).to.be.a.file();
                });
        });

        it('should break when passing invalid type to db', () => {
            const source = compileES6(`
                export default {
                    extension(context) {
                        return {
                            alerts: {},
                            db: x => x
                        };
                    }
                };
            `);

            return runAndGetAlerts({ name: extensionName, source }, {})
                .then(result => {
                    throw new Error('It should break');
                })
                .catch(err => {
                    expect(err.message).to.match(/Unsupported type Function/);
                });
        });

        it('should read data from db', () => {
            return read(extensionName)
                .then(result => {
                    expect(result.counter).to.equals(1);
                });
        });

        it('should update an object in the database', () => {
            const source = compileES6(`
                export default {
                    extension(context) {
                        return {
                            alerts: {},
                            db: { counter: context.db.counter + 1 }
                        };
                    }
                };
            `);

            return read(extensionName)
                .then(db => runAndGetAlerts({ name: extensionName, source }, { db }))
                .then(result => {
                    expect(result.db.counter).to.equals(2);
                });
        });

        it('should drop the file when passed undefined', () => {
            const source = compileES6(`
                export default {
                    extension(context) {
                        return {
                            alerts: {}
                        };
                    }
                };
            `);

            return runAndGetAlerts({ name: extensionName, source }, {})
                .then(() => {
                    expect(dbPath).to.not.be.a.path();
                });
        });
    });

    describe('Command line database', () => {
        it('should cause an error on invalid option', () => {
            const stream = createStream(['db', 'write']);

            return stream.once('data')
                .then(result => {
                    expect(result).to.match(/Ooooops, something went wrong.../);
                    return stream.once('data');
                })
                .then(result => {
                    expect(result).to.match(/Unknown option write/);
                })
                .finally(stream.close);
        });
    });
});
