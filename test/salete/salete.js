import fs from 'fs';
import { spawn } from 'child_process';
import concatStream from 'concat-stream';
import agent from 'superagent';
import rimraf from 'rimraf';
import promisifyAgent from 'superagent-promise';
import Promise, { delay, promisify } from 'bluebird';
import {
    adjust,
    complement,
    equals,
    identity,
    is,
    join,
    map,
    multiply,
    remove as removeAt,
    split,
    takeWhile,
    when
} from 'ramda';

export const request = promisifyAgent(agent, Promise);
export const createFolder = promisify(fs.mkdir);
export const createFile = promisify(fs.writeFile);
export const readFile = promisify(fs.readFile);
export const renameFile = promisify(fs.rename);
export const remove = promisify(rimraf);
export const removeChunk = (file, from, upTo = 1) => readFile(file, 'utf-8')
    .then(split('\n') & removeAt(from - 1, upTo) & join('\n'))
    .then(createFile(file, _));
export const replaceLine = (file, line, content) => readFile(file, 'utf-8')
    .then(split('\n') & adjust(~content, line - 1) & join('\n'))
    .then(createFile(file, _));

export const promisifyStream = fn => promisify((param, callback) => {
    fn(param, callback(null, _));
});

export function createStream(command, args = [], env = {}) {
    const task = spawn(command, args, { stdio: 'pipe', env });
    task.stdout.setEncoding('utf-8');

    return {
        once: promisifyStream(task.stdout.once.bind(task.stdout)),
        on: promisifyStream(task.stdout.on.bind(task.stdout)),
        write: promisifyStream(task.stdin.write.bind(task.stdin)),
        close: ~task.kill('SIGTERM'),
        process: ~task
    };
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
        UP: '\x1B\x5B\x41',
        SPACE: '\x20'
    }
};

/**
 * Tells Salete to keep calm for at max n seconds
 */
export const keepCalm = multiply(1000);

// Salete is lazy on Travis CI
const multiplier = process.env.FAST_TEST === '1' ? 1 : 2;

/**
 * Spawns Salete to work.
 * Creates an IO event loop to work on dynamic buffered input and output.
 * Receives a set of options to work:
 *
 * runs :: String[] - Command list to run
 * procrastionation :: Number - Default procrastination time
 * does :: String[] - Combo of commands
 * clear :: Boolean - Whether the output should be escape-free
 *
 * @param {Object} options - The options to Salete
 */
export default function salete({
    runs: [command, ...args],
    procrastination = 500,
    does = [],
    clear = false,
    env = {} } = {}) {
    const stream = createStream(command, args, env);
    const task = stream.process();
    const eventLoop = ([head, ...tail]) => {
        if (head) {
            const interval = is(Number, head)
                ? delay(head * multiplier)
                : delay(procrastination * multiplier).tap(~stream.write(head));

            return interval.tap(~eventLoop(tail));
        }

        task.stdin.end();
    };

    eventLoop(does);
    return new Promise(concatStream & task.stdout.pipe)
        .then(when(~clear, clearAnsiEscapes));
}
