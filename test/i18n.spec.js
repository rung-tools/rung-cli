import { expect } from 'chai';
import { getLocale, translator } from '../src/i18n';

describe('i18n.js', () => {
    describe('Locale', () => {
        it('should get locale from machine', () => {
            return getLocale()
                .then(locale => {
                    expect(locale).to.match(/^[a-z]{2}_([A-Z]{2,3})?$/);
                });
        });

        it('should allow translation', () => {
            const simplifiedChinese = {
                'I\'m 20 years old': '我是18岁'
            };
            const _ = translator(simplifiedChinese);

            expect(_('I\'m 20 years old')).to.equals('我是18岁');
        });

        it('should allow string interpolation', () => {
            const simplifiedChinese = {
                '{{name}} is {{age}} years old': '{{name}}是{{age}}岁'
            };
            const _ = translator(simplifiedChinese);
            const sentence = _('{{name}} is {{age}} years old', {
                name: 'Celão',
                age: 20
            });

            expect(sentence).to.equals('Celão是20岁');
        });
    });
});
