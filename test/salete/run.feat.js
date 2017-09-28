import process from 'process';
import { expect } from 'chai';
import { join } from 'ramda';
import { delay, race } from 'bluebird';
import work, {
    keepCalm,
    keyboard,
    request
} from './salete';

const { press, type } = keyboard;
const run = (args = []) => ({
    runs: ['node', '../dist/cli.js', 'run', ...args],
    does: [
        type('Salete'), press.ENTER,
        keepCalm(15)
    ]
});

export default () => {
    before(~process.chdir('salete-hello-world'));

    it('should run the Hello World from Salete (raw)', () => {
        return work(run(['--raw']))
            .then(output => {
                expect(output).to.contain('What is your name?');
                expect(output).to.contain([
                    '[ { title: \'Welcome\',',
                    '    content: \'<b>Hello Salete</b>\',',
                    '    resources: [] } ]'
                ] | join('\n'));
            });
    }).timeout(keepCalm(20));

    it('should run the Hello World from Salete with table view', () => {
        return work(run())
            .then(output => {
                expect(output).to.contain('What is your name?');
                expect(output).to.contain([
                    '┌──────────┬────────────────────┬───────────────────────────────────┬──────────────────────────┐',
                    '│ Key      │ Title              │ Content                           │ Comment                  │',
                    '├──────────┼────────────────────┼───────────────────────────────────┼──────────────────────────┤',
                    '│ 0        │ Welcome            │ <b>Hello Salete</b>               │                          │',
                    '└──────────┴────────────────────┴───────────────────────────────────┴──────────────────────────┘'
                ] | join('\n'));
            });
    }).timeout(keepCalm(20));

    it('should run in live mode!', () => {
        const deadline = delay(20000);

        return race([deadline, work(run(['--live']))])
            .then(result => request.get('http://localhost:5001'))
            .then(({ text }) => {
                expect(text).to.contain('Rung CLI Hot Server');
            });
    }).timeout(keepCalm(60));

    after(~process.chdir('..'));
};
