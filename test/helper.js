import { spawn } from 'child_process';
import concat from 'concat-stream';
import Promise, { delay, promisify } from 'bluebird';

const promisifyStream = fn => promisify((param, callback) => {
    fn(param, callback(null, _));
});

export function createCustomStream(env, args = [], cmd = 'dist/cli.js') {
    const task = spawn('node', [cmd, ...args], { stdio: 'pipe', env });
    task.stdout.setEncoding('utf-8');

    return {
        once: promisifyStream(task.stdout.once.bind(task.stdout)),
        on: promisifyStream(task.stdout.on.bind(task.stdout)),
        write: promisifyStream(task.stdin.write.bind(task.stdin)),
        after: promisifyStream(task.stdin.on.bind(task.stdin, 'close')),
        close: ~task.kill('SIGTERM'),
        process: ~task
    };
}

export function createStream(args = [], cmd = 'dist/cli.js') {
    return createCustomStream({}, args, cmd);
}

export const ENTER = '\x0D';
export const DOWN = '\x1B\x5B\x42';
export const UP = '\x1B\x5B\x41';

export function monkey(stream, combo = [], timeout = 500) {
    const task = stream.process();

    const eventLoop = combo => {
        if (combo.length > 0) {
            const [head, ...tail] = combo;
            return delay(timeout)
                .then(~stream.write(head))
                .then(~eventLoop(tail));
        }

        task.stdin.end();
    };

    eventLoop(combo);
    return new Promise(concat & task.stdout.pipe);
}
