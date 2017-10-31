import os from 'os';
import path from 'path';
import { split } from 'ramda';
import { expect } from 'chai';
import work, {
    createFile,
    createFolder,
    keepCalm,
    remove
} from './salete';

const rungFolder = path.join(os.homedir(), '.rung');
const write = {
    runs: ['node', 'dist/cli.js', 'db', 'write'],
    does: [keepCalm(30)],
    clear: true
};
const read = {
    runs: ['node', 'dist/cli.js', 'db', 'read'],
    does: [keepCalm(30)],
    clear: true
};
const clear = {
    runs: ['node', 'dist/cli.js', 'db', 'clear'],
    does: [keepCalm(30)]
};

export default () => {
    it('should refuse invalid option for db', () => {
        return work(write)
            .tap(output => {
                expect(output).to.contain('Unknown option write');
            });
    }).timeout(keepCalm(40));

    it('should fail to read database when a file doesn\'t exist', () => {
        return work(read)
            .tap(output => {
                expect(output).to.contain('Unable to read database');
            });
    }).timeout(keepCalm(40));

    it('should read database when it exists', () => {
        return remove(rungFolder)
            .tap(~createFolder(rungFolder))
            .tap(~createFile(path.join(rungFolder, 'rung-cli.db'), JSON.stringify({
                name: 'Katilaynne',
                age: 27
            })))
            .then(~work(read))
            .tap(output => {
                const [name, age] = output | split('\n');
                expect(name).to.equals('name: Katilaynne');
                expect(age).to.equals('age:  27');
            });
    }).timeout(keepCalm(40));

    it('should drop the database via rung db clear', () => {
        return work(clear)
            .then(() => {
                expect(path.join(rungFolder, 'rung-cli.db')).to.not.be.a.path();
            });
    }).timeout(keepCalm(30));
};
