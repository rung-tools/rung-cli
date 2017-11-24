import { expect } from 'chai';
import work, { keepCalm, keyboard } from './salete';

const { press, type, wait } = keyboard;
const salete = {
    runs: ['node', 'dist/cli.js', 'boilerplate'],
    does: [
        type('salete-hello-world' + press.ENTER),
        type('0.2.1' + press.ENTER),
        type('Very Cool Project'), wait(50), press.ENTER,
        type('This is only a test' + press.ENTER),
        press.UP + press.ENTER,
        press.ENTER
    ],
    procrastination: 1000,
    clear: true
};

export default () => {
    it('should create a default project boilerplate to work on', () => {
        return work(salete)
            .tap(output => {
                expect(output).to.contain('project generated');
                expect('salete-hello-world').to.be.a.directory()
                    .with.files(['README.md', 'index.js', 'package.json']);
                expect('salete-hello-world/info').to.be.a.directory();
            });
    }).timeout(keepCalm(60));

    it('should raise error when the folder of the project already exists', () => {
        return work(salete)
            .then(output => {
                expect('salete-hello-world').to.be.a.directory();
                expect(output).to.match(/Unable to create folder salete-hello-world/);
            });
    }).timeout(keepCalm(60));
};
