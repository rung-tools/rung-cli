import { delay, resolve } from 'bluebird';
import { stdin } from 'process';

export const ENTER = '\n';

export default function createMonkey() {
    const monkey = {
        procrastinate() {
            return delay(500).return(this)
        },
        type(text) {
            return resolve(process.stdin.write(text))
                .return(this);
        }
    };

    return monkey;
}

