import { expect } from 'chai';
import work, { keepCalm } from './salete';

export default () => {
    it('can read the Rung CLI help', () => {
        const salete = {
            runs: ['node', 'dist/cli.js', '--help'],
            does: [keepCalm(5)],
            clear: true
        };

        return work(salete)
            .tap(output => {
                expect(output).to.be.a('string');
                expect(output).to.contain('Usage');
                expect(output).to.contain('Commands');
                expect(output).to.contain('Options');
            });
    }).timeout(10000);
};
