import { spawn } from 'child_process';
import { promisify } from 'bluebird';

const promisifyStream = fn => promisify((param, callback) => {
    fn(param, callback(null, _));
});

export function createCustomStream(env, args, cmd = 'dist/cli.js') {
    const task = spawn('node', [cmd, ...args], { stdio: 'pipe', env });
    task.stdout.setEncoding('utf-8');

    return {
        once: promisifyStream(task.stdout.once.bind(task.stdout)),
        on: promisifyStream(task.stdout.on.bind(task.stdout)),
        write: promisifyStream(task.stdin.write.bind(task.stdin)),
        after: promisifyStream(task.stdin.on.bind(task.stdin, 'close')),
        close: ~task.kill('SIGTERM')
    };
}

export function createStream(args, cmd = 'dist/cli.js') {
    return createCustomStream({}, args, cmd);
}
