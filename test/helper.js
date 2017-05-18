import thread from 'child_process';
import { promisify } from 'bluebird';

const promisifyStream = fn => promisify((param, callback) => {
    fn(param, result => { callback(null, result); });
});

export function createStream(args) {
    const task = thread.spawn('node', ['dist/cli.js', ...args], { stdio: 'pipe' });
    task.stdout.setEncoding('utf-8');

    return {
        once: promisifyStream(task.stdout.once.bind(task.stdout)),
        on: promisifyStream(task.stdout.on.bind(task.stdout)),
        write: promisifyStream(task.stdin.write.bind(task.stdin)),
        after: promisifyStream(task.stdin.on.bind(task.stdin, 'close')),
        close: () => task.kill('SIGTERM')
    };
}
