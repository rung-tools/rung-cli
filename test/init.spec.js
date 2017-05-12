import { expect } from 'chai';
import { createStream } from './helper';

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
        }).timeout(10000);
    });
});