import { expect } from 'chai';
import { split } from 'ramda';
import work, { keepCalm, keyboard } from './salete';

export default () => {
    it('should compile the generated boilerplate', () => {
        process.chdir('salete-hello-world');
        const npm = {
            runs: ['npm', 'install'],
            does: [keepCalm(5 * 60)]
        };
        const compile = {
            runs: ['node', '../dist/cli.js', 'build'],
            does: [keepCalm(30)]
        };

        return work(npm)
            .then(() => {
                void expect('node_modules').to.be.a.directory().and.not.empty;
                return work(compile);
            })
            .then(output => {
                const [warning, success] = output | split('\n');
                expect(warning).to.contain('compiling extension without providing an icon.png file');
                expect(success).to.contain('Rung extension compilation');
            })
            .finally(() => {
                process.chdir('..');
            });
    }).timeout(keepCalm(90));
};
