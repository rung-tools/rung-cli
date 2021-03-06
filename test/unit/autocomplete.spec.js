import { expect } from 'chai';
import { keys } from 'ramda';
import getAutocompleteSources, { compileClosure } from '../../src/autocomplete';

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
    it('should return empty object when there is no autocomplete folder', () => {
        return getAutocompleteSources()
            .then(object => {
                expect(object).to.be.an('object');
                expect(keys(object)).have.lengthOf(0);
            });
    });

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
