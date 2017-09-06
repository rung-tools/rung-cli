import process from 'process';
import { expect } from 'chai';
import work, { keepCalm, keyboard } from './salete';

const { press, type } = keyboard;
const publish = {
    runs: ['node', '../dist/cli.js', 'publish'],
    does: [
        type('salete'), press.ENTER,
        type('salete@rung.com.br'), press.ENTER,
        type('ilovecapybaras'), press.ENTER,
        keepCalm(10)
    ]
};

export default () => {
    before(~process.chdir('salete-hello-world'));

    it('should refuse publishing because Salete doesn\'t remember her password', () => {
        return work(publish)
            .then(output => {
                expect(output).to.contain('? Rung email salete@rung.com.br');
                expect(output).to.contain('? Rung password [hidden]');
                expect(output).to.contain('Unauthorized');
            });
    }).timeout(keepCalm(60));

    after(~process.chdir('..'));
};
