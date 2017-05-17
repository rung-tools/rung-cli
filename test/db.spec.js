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
        it('should create a database file in home when first running', () => {
            const source = compileES6(`
                export default {
                    extension(context) {
                        return {
                            alerts: {},
                            db: {
                                counter: 0
                            }
                        };
                    }
                };
            `);

            return runAndGetAlerts({ name: extensionName, source }, {})
                .then(result => {
                    // const { counter } = result.db;
                    // expect(dbPath).to.be.a.file();
                });
        });
    });
});
