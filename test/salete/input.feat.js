import { expect } from 'chai';
import {
    assoc,
    head,
    map,
    match,
    nth,
    reverse,
    split
} from 'ramda';
import * as t from '../../src/types';
import work, { keepCalm, keyboard, removeChunk, replaceLine } from './salete';

const { type, press } = keyboard;

const components = {
    integer: { type: t.Integer },
    double: { type: t.Double },
    natural: { type: t.Natural },
    dateTime: { type: t.DateTime },
    char: { type: t.Char(5) },
    integerRange: { type: t.IntegerRange(10, 20) },
    doubleRange: { type: t.DoubleRange(10, 20) },
    money: { type: t.Money },
    string: { type: t.String },
    color: { type: t.Color },
    email: { type: t.Email },
    checkbox: { type: t.Checkbox },
    oneOf: { type: t.OneOf(['Haskell', 'Scala', 'Clojure']) },
    url: { type: t.Url },
    integerMultiRange: { type: t.IntegerMultiRange(0, 50) },
    calendar: { type: t.Calendar },
    location: { type: t.Location },
    selectBox: { type: t.SelectBox({ haskell: 'Haskell', erlang: 'Erlang' }) },
    name: { type: t.AutoComplete },
} | map(assoc('description', 'question'));

const actions = [
    type('foo' + press.ENTER), type('-10.5' + press.ENTER), keepCalm(1), // Integer
    type('66.6' + press.ENTER), keepCalm(1), // Double
    type('-100' + press.ENTER), type('200' + press.ENTER), // Natural
    press.UP, press.ENTER, keepCalm(1), // DateTime
    type('Lorem ipsum dolor sit amet' + press.ENTER), // Char
    type('5' + press.ENTER), type('15' + press.ENTER), // IntegerRange
    type('5' + press.ENTER), type('15.5' + press.ENTER), // DoubleRange
    type('10,25' + press.ENTER), // Money
    type('Java is bad' + press.ENTER), // String
    type('#FF0000' + press.ENTER), // Color
    type('invalid-email' + press.ENTER), type('celao@no-spam.net' + press.ENTER), // Email
    type('Y' + press.ENTER), // Checkbox
    press.DOWN, press.ENTER, // OneOf
    type('https://github.com/rung-tools/' + press.ENTER), // Url
    type('10 20' + press.ENTER), // IntegerMultiRange
    press.ENTER, // Calendar
    type('New York' + press.ENTER), // Location
    press.DOWN, press.ENTER, keepCalm(1), // SelectBox
    keepCalm(1), type('Lari'), keepCalm(1), press.ENTER, keepCalm(1), // AutoComplete
    keepCalm(15)
];

export default () => {
    before(() => {
        process.chdir('salete-hello-world');
        return removeChunk('index.js', 2, 5)
            .then(~replaceLine('index.js', 8, 'content: JSON.stringify(context.params),'))
            .then(~removeChunk('index.js', 26));
    });

    it('should test all the component types', () => {
        return removeChunk('index.js', 15, 5)
            .then(~replaceLine('index.js', 14, `const params = ${JSON.stringify(components)};`))
            .then(~work({
                runs: ['node', '../dist/cli.js', 'run', '--raw'],
                does: actions,
                clear: true
            }))
            .then(output => {
                // Get the line with the results and parse to JS object
                const result = output
                    | split('\n')
                    | reverse
                    | nth(2)
                    | match(/\{.*\}/)
                    | head
                    | JSON.parse;

                expect(result.integer).to.equals(-10);
                expect(result.double).to.equals(66.6);
                void expect(new Date(result.dateTime).valueOf()).to.not.be.NaN;
                expect(result.char).to.equals('Lorem');
                expect(result.integerRange).to.equals(15);
                expect(result.doubleRange).to.equals(15.5);
                expect(result.money).to.equals(10.25);
                expect(result.string).to.equals('Java is bad');
                expect(result.color).to.equals('#FF0000');
                expect(result.email).to.equals('celao@no-spam.net');
                void expect(result.checkbox).to.be.true;
                expect(result.oneOf).to.equals('Scala');
                expect(result.url).to.equals('https://github.com/rung-tools/');
                expect(result.integerMultiRange).to.deep.equals([10, 20]);
                expect(result.calendar).to.be.a('string');
                expect(result.location).to.equals('New York');
                expect(result.selectBox).to.equals('erlang');
                expect(result.name).to.equal('Larissa');
            });
    }).timeout(keepCalm(90));

    after(~process.chdir('..'));
};
