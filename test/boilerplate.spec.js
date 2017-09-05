import { promisify } from 'bluebird';
import chai, { expect } from 'chai';
import { join } from 'ramda';
import fs from 'chai-fs';
import json from 'chai-json-schema';
import rimraf from 'rimraf';
import work, { keyboard } from './salete';

chai.use(fs);
chai.use(json);

const rm = promisify(rimraf);
const { press, type, wait } = keyboard;

describe('boilerplate.js', () => {
    describe('Input and output', () => {
        after(~rm('very-cool-project'));
        before(~rm('very-cool-project'));

        it.only('should correctly deal with the questions', () => {
            const salete = {
                runs: ['node', 'dist/cli.js', 'boilerplate'],
                does: [
                    type('very-cool-project' + press.ENTER), wait(100),
                    type('0.2.1' + press.ENTER), wait(100),
                    type('Very Cool Project' + press.ENTER), wait(100),
                    type('This is only a test' + press.ENTER), wait(100),
                    press.UP + press.ENTER,
                    press.ENTER
                ],
                procrastination: 1000,
                clear: true
            };

            return work(salete)
                .tap(output => {
                    const expected = [
                        '? Project name (rung-cli) ',
                        '? Version (1.0.0) ',
                        '? Title (Untitled) ',
                        '? Description ',
                        '? Category (Use arrow keys)',
                        '  Asset Maintenance ',
                        '  Fleet Management ',
                        '  Games ',
                        '❯ Miscellaneous ',
                        '  Movies & TV ',
                        '  Occupational Health and Safety ',
                        '  Retail ',
                        '(Move up and down to reveal more choices)',
                        '  Travel ',
                        '  Asset Maintenance ',
                        '  Fleet Management ',
                        '❯ Games ',
                        '  Miscellaneous ',
                        '  Movies & TV ',
                        '  Occupational Health and Safety ',
                        '(Move up and down to reveal more choices)',
                        '? license (MIT) ',
                        ' ✔ Success: project generated',
                        ''
                    ] | join('\n');

                    expect(output).to.equals(expected);
                });
        }).timeout(30000);
    });
});
