import { expect } from 'chai';
import { runAndGetAlerts } from '../src/vm';
import { compileES6 } from '../src/compiler';

describe('compiler.js', () => {
    describe('Babel compiler and JSX', () => {
        it('should compile and run ES6 features using Babel compiler', () => {
            const source = compileES6(`
                class Programmer {
                    setName(name) { this.name = name; }
                    getName() { return this.name }
                    greet() { return \`Hello, I'm \${this.name}\`; }
                }

                export default { extension: () => {
                    const hello = new Programmer();
                    hello.setName('Marcelo');
                    return hello.greet();
                } };
            `);

            return runAndGetAlerts({ name: 'test-babel-compiler', source }, {})
                .then(result => {
                    expect(result).to.equals('Hello, I\'m Marcelo');
                });
        });

        it('should compile JSX syntax down to HTML', () => {
            const source = compileES6(`
                const annoy = <b>aborrecer</b>;
                const style = {
                    color: 'red',
                    backgroundColor: 'blue'
                };
                const component = (
                    <div className="component" style={ style }>
                        Você fala demais, acabei de me { annoy }
                        <br hue="land" />
                    </div>
                );

                export default { extension: () => component };
            `);

            return runAndGetAlerts({ name: 'test-jsx-compiler', source }, {})
                .then(result => {
                    expect(result).to.equals([
                        '<div class="component" style="color:red;background-color:blue">',
                        'Você fala demais, acabei de me ',
                        '<b>aborrecer</b><br hue="land" /></div>'
                    ].join(''));
                });
        });

        it('shouldn\'t allow script and style tags', () => {
            const source = compileES6(`
                const annoy = <b>aborrecer</b>;
                const style = {
                    color: 'red',
                    backgroundColor: 'blue'
                };
                const component = (
                    <div>
                        <script>alert();</script>
                        Alerting?
                    </div>
                );

                export default { extension: () => component };
            `);

            return runAndGetAlerts({ name: 'test-jsx-strip-tags', source }, {})
                .then(result => {
                    expect(result).to.equals('<div><span>alert();</span>Alerting?</div>');
                });
        });

        it('should correctly join array elements', () => {
            const source = compileES6(`
                const component = (
                    <div>
                        { [1, 2, 3].map(num => <b>{ num }</b>) }
                    </div>
                );

                export default { extension: () => component };
            `);

            return runAndGetAlerts({ name: 'test-jsx-array', source }, {})
                .then(result => {
                    expect(result).to.equals('<div><b>1</b><b>2</b><b>3</b></div>');
                });
        });

        it('should differ self-closing tags', () => {
            const source = compileES6(`
                const component = (
                    <div>
                        <div id="foo" />
                        <br />
                    </div>
                );

                export default { extension: () => component };
            `);

            return runAndGetAlerts({ name: 'test-jsx-array', source }, {})
                .then(result => {
                    expect(result).to.equals('<div><div id="foo"></div><br /></div>');
                });
        });
    })
});
