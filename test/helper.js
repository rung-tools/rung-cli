import { spawn } from 'child_process';
import concat from 'concat-stream';
import Promise, { delay, promisify } from 'bluebird';
import {
    complement,
    equals,
    join,
    identity,
    is,
    map,
    split,
    takeWhile
 } from 'ramda';

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

/**
 * Returns the visible characters from a byte array (represented as string)
 *
 * @param {String} byteArray
 * @return {String}
 */
export const clearAnsiEscapes = split('\n')
    & map(split('') & takeWhile(complement(equals('\u001b'))) & join(''))
    & join('\n');

/**
 * Ansi escape codes for keypress
 */
export const keyboard = {
    type: identity,
    wait: identity,
    press: {
        ENTER: '\x0D',
        DOWN: '\x1B\x5B\x42',
        UP: '\x1B\x5B\x41'
    }
};

/**
 * Spawns a monkey to work.
 * Creates an IO event loop to work on dynamic buffered input and output.
 * Receives a stream, a combo and a timeout, where the combo may contain
 * ansi escape codes to common CLI operations.
 *
 * @param {Object} stream - the promisified stream object
 * @param {Object} opts - The options to the monkey
 */
export function spawnMonkey(stream, { combo = [], procrastination = 500 }) {
    const task = stream.process();

    const eventLoop = ([head, ...tail]) => {
        if (head) {
            const interval = is(Number, head)
                ? delay(head)
                : delay(procrastination).tap(~stream.write(head));

            return interval.tap(~eventLoop(tail));
        }

        task.stdin.end();
    };

    eventLoop(combo);
    return new Promise(concat & task.stdout.pipe);
}
