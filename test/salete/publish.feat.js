import process from 'process';
import { expect } from 'chai';
import work, { keepCalm, keyboard } from './salete';

const { press, type } = keyboard;
const publish = (args = [], env = {}) => ({
    runs: ['node', '../dist/cli.js', 'publish', ...args],
    does: [
        type('salete'), press.ENTER,
        type('salete@rung.com.br'), press.ENTER,
        type('ilovecapybaras'), press.ENTER,
        keepCalm(10)
    ],
    env
});

export default () => {
    before(~process.chdir('salete-hello-world'));

    it('should refuse publishing because Salete doesn\'t remember her password', () => {
        return work(publish())
            .then(output => {
                expect(output).to.contain('? Rung email salete@rung.com.br');
                expect(output).to.contain('? Rung password [hidden]');
                expect(output).to.contain('Unauthorized');
            });
    }).timeout(keepCalm(60));

    it('should at least try to reference a *.rung binary to upload to another api', () => {
        return work(
            publish(['--file=salete-hello-world.rung', '--private']), {
                RUNG_API: 'http://35.165.157.18/api/'
            })
            .then(output => {
                expect(output).to.contain('Unauthorized');
            });
    }).timeout(keepCalm(60));

    it('should emit warning for a wrong URL', () => {
        return work(
            publish(['--file=salete-hello-world.rung', '--private']), {
                RUNG_API: 'trololololololo'
            })
            .then(output => {
                expect(output).to.contain('invalid API for Rung');
            });
    })

    after(~process.chdir('..'));
};
