import { expect } from 'chai';
import { runAndGetAlerts } from '../src/vm';

describe('compiler.js', () => {
    describe('Babel compiler and JSX', () => {
        it('should compile and run ES6 features using Babel compiler', () => {
            const source = `
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
            `;

            return runAndGetAlerts({ name: 'test-babel-compiler', source }, {})
                .then(result => {
                    expect(result).to.equals('Hello, I\'m Marcelo');
                });
        });

        it('should compile JSX syntax down to HTML', () => {
            const source = `
                const annoy = <b>aborrecer</b>;
                const component = (
                    <div className="component" style={{color:'red'}}>
                        Você fala demais, acabei de me { annoy }
                        <br hue="land" />
                    </div>
                );

                export default { extension: () => component };
            `;

            return runAndGetAlerts({ name: 'test-jsx-compiler', source }, {})
                .then(result => {
                    expect(result).to.equals([
                        '<div class="component" style={"color":"red"}>',
                        'Você fala demais, acabei de me ',
                        '<b>aborrecer</b><br hue="land" /></div>'
                    ].join(''));
                });
        });
    })
});