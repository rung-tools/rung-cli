import { expect } from 'chai';
import { trim } from 'ramda';
import { version as rungCliVersion } from '../../package';
import work, { keepCalm } from './salete';

export default () => {
    it('can read the version of Rung CLI as in package.json', () => {
        const salete = {
            runs: ['node', 'dist/cli.js', '--version'],
            does: [keepCalm(5)],
            clear: true
        };

        return work(salete)
            .tap(version => {
                expect(version | trim).to.equals(rungCliVersion);
            });
    }).timeout(10000);
};
