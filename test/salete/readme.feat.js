import process from 'process';
import { expect } from 'chai';
import work, { keepCalm } from './salete';

const readme = {
    runs: ['node', '../dist/cli.js', 'readme'],
    does: [keepCalm(30)]
};

export default () => {
    before(~process.chdir('salete-hello-world'));

    it('should generate a README from Salete\'s extension', () => {
        return work(readme)
            .then(output => {
                expect(output).to.contain('generated README.md');
                expect('README.md').to.be.a.file();
            });
    }).timeout(keepCalm(30));

    after(~process.chdir('..'));
};
