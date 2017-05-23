import { expect } from 'chai';
import { getLocale } from '../src/i18n';

describe('i18n.js', () => {
    describe('Locale', () => {
        it.only('should get locale from machine', () => {
            return getLocale()
                .then(locale => {
                    expect(locale).to.match(/[a-z]{2}_[A-Z]{2}/);
                });
        });
    });
});