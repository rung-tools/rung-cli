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

function sourceWithDb(db) {
    return compileES6(`
        export default {
            extension(context) {
                return {
                    alerts: {},
                    db: ${JSON.stringify(db)}
                };
            }
        };
    `);
}

describe.only('db.js', () => {
    before(() => rm(dbPath));

    describe('Database', () => {
        it('should store an object in the database', () => {
            const source = sourceWithDb({
                counter: 1
            });

            return runAndGetAlerts({ name: extensionName, source }, {})
                .then(result => {
                    expect(dbPath).to.be.a.file();
                });
        });

        it('should drop the file when passed undefined', () => {
            const source = sourceWithDb(undefined);

            return runAndGetAlerts({ name: extensionName, source }, {})
                .then(() => {
                    expect(dbPath).to.not.be.a.path();
                });
        });
    });
});
