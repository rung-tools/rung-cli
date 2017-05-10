import path from 'path';
import thread from 'child_process';
import Promise, { promisify } from 'bluebird';
import { expect } from 'chai';

const promisifyStream = fn => promisify((param, callback) => {
    fn(param, result => { callback(null, result); });
});

function createStream(args) {
    const task = thread.spawn('node', ['dist/cli.js', ...args], { stdio: 'pipe' });
    task.stdout.setEncoding('utf-8');

    return {
        once: promisifyStream(task.stdout.once.bind(task.stdout)),
        on: promisifyStream(task.stdout.on.bind(task.stdout)),
        write: promisifyStream(task.stdin.write.bind(task.stdin)),
        close: () => task.kill('SIGTERM')
    };
}

describe('init.js', () => {
    describe('Mocking stdin and stdout is successful', () => {
        it('should receive the questions and answer to them', () => {
            const stream = createStream(['init']);
            const next = (text = '') => stream.write(`${text}\r`)
                .then(() => stream.once('data'));

            return stream.once('data')
                .then(name => {
                    expect(name).to.match(/Project name/);
                    return next('hello-world');
                })
                .then(version => {
                    expect(version).to.match(/Version/);
                    return next('0.1.0');
                })
                .then(title => {
                    expect(title).to.match(/Title/);
                    return next('Hello world');
                })
                .then(description => {
                    expect(description).to.match(/Description/);
                    return next('Hello world test');
                })
                .then(category => {
                    expect(category).to.match(/Category/);
                    return next('miscellaneous');
                })
                .then(entryPoint => {
                    expect(entryPoint).to.match(/Entry point/);
                    return next();
                })
                .then(license => {
                    expect(license).to.match(/License/);
                    return next();
                })
                .finally(stream.close);
        });
    });
});