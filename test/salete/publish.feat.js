import process from 'process';
import http from 'http';
import { expect } from 'chai';
import Promise from 'bluebird';
import work, { keepCalm, keyboard } from './salete';

const FAKE_SERVER_PORT = 3666;
const { press, type } = keyboard;
const publish = (args = [], env = {}) => ({
    runs: ['node', '../dist/cli.js', 'publish', ...args],
    does: [
        type('salete'), press.ENTER,
        type('salete@rung.com.br'), press.ENTER,
        type('ilovecapybaras'), press.ENTER,
        keepCalm(60)
    ],
    env
});

/**
 * Prepares and starts a fake server to publication
 */
function prepareRungServer() {
    const server = http.createServer((req, res) => {
        if (req.method !== 'POST') {
            res.writeHead(404);
            return res.end();
        }

        const routes = {
            '/login': ~res.writeHead(200),
            '/metaExtensions': ~res.writeHead(201)
        };

        routes[req.url]();
        return res.end();
    });

    return new Promise(server.listen(FAKE_SERVER_PORT, _));
}

export default () => {
    before(() => {
        process.chdir('salete-hello-world');
        return prepareRungServer();
    });

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
                RUNG_API: 'http://35.165.157.18/api'
            })
            .then(output => {
                expect(output).to.contain('Error');
            });
    }).timeout(keepCalm(60));

    it('should emit warning for a wrong URL', () => {
        return work(publish([], { RUNG_API: 'trololololololo' }))
            .then(output => {
                expect(output).to.contain('invalid API for Rung');
            });
    }).timeout(keepCalm(60));

    it('should publish the extension for the fake server', () => {
        return work(publish([], { RUNG_API: `http://localhost:${FAKE_SERVER_PORT}` }))
            .then(output => {
                expect(output).to.not.contain('Error');
            });
    }).timeout(keepCalm(120));

    after(~process.chdir('..'));
};
