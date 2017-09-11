import process from 'process';
import { expect } from 'chai';
import {
    complement,
    contains,
    find,
    identity,
    isNil,
    match,
    nth,
    split,
    tryCatch,
    when
} from 'ramda';
import { Maybe } from 'ramda-fantasy';
import Promise from 'bluebird';
import jsonServer from 'json-server';
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
    const server = jsonServer.create();
    const middlewares = jsonServer.defaults({
        logger: false
    });

    server.use(middlewares);
    server.post('/login', (req, res) => {
        res.sendStatus(200);
    });
    server.post('/metaExtensions', (req, res) => {
        res.sendStatus(201);
    });
    return new Promise(server.listen(FAKE_SERVER_PORT, _));
}

/**
 * Finds the running fake server pid and kills it
 */
function killRungServer() {
    if (!/linux/.test(process.platform)) {
        return;
    }

    return work({ runs: ['/bin/netstat', '-anp'] })
        .then(output => {
            const pid = output
                | split('\n')
                | find(contains(`:${FAKE_SERVER_PORT}`))
                | when(complement(isNil), match(/(\d+)\/nodejs/) & nth(1))
                | Maybe.of;

            pid.chain(tryCatch(parseInt(_, 10) & process.kill, identity));
        });
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

    after(() => {
        process.chdir('..');
        return killRungServer();
    });
};
