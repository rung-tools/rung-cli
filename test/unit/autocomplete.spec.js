import process from 'process';
import { expect } from 'chai';
import getAll, { compileClosure } from '../../src/autocomplete';

const sourceLogic = `lib
    .request.get('https://raw.githubusercontent.com/BrunnerLivio/PokemonDataGraber/master/output.json')
    .then(res => JSON.parse(res.text))
    .then(pokemons => pokemons.map(pokemon => pokemon.Name))
    .then(names => names.filter(
        input.trim() === ''
            ? Boolean
            : name => name && name.toLowerCase().startsWith(input.toLowerCase())
    ))
`;

const wrongSource = 'export default 666;';

const promiseSource = `
export default function ({ input, lib }) {
    return ${sourceLogic};
}
`;

const callbackSource = `
export default function ({ input, lib }, done) {
    ${sourceLogic}.then(done);
}
`;

export default () => {
    it('should refuse compiling a non-function', () => {
        expect(~compileClosure('failure', 'export default 1;')).to.throw(TypeError);
    });

    it('should compile a closure that returns a promise', () => {
        const closure = compileClosure('promise', promiseSource);
        expect(closure).to.be.a('function');

        return closure({}, 'b')
            .then(pokemons => {
                expect(pokemons).to.be.an('array');
                expect(pokemons).to.contain('Bulbasaur');
                expect(pokemons).to.contain('Blastoise');
                expect(pokemons).to.contain('Blissey');
            });
    }).timeout(5000);

    it('should compile a closure that receives a callback', () => {
        const closure = compileClosure('callback', callbackSource);
        expect(closure).to.be.a('function');

        return closure({}, 'pi')
            .then(pokemons => {
                expect(pokemons).to.be.an('array');
                expect(pokemons).to.contain('Pidgey');
                expect(pokemons).to.contain('Pikachu');
            });
    }).timeout(5000);
};
