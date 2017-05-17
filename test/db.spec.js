import os from 'os';
import path from 'path';
import chai, { expect } from 'chai';
import { promisify } from 'bluebird';
import rimraf from 'rimraf';
import fs from 'chai-fs';
import { runAndGetAlerts } from '../src/vm';
import { compileES6 } from '../src/compiler';

chai.use(fs);

const rm = promisify(rimraf);
const home = os.homedir();
const extensionName = 'rung-database-test';
const dbPath = path.join(home, '.rung', `${extensionName}.db`);

describe.only('db.js', () => {
    before(() => rm(dbPath));

    describe('Database', () => {
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

        it('should read and update data from db');

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
});
