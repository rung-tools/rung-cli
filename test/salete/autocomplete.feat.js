import { createFile, createFolder } from './salete';

export default () => {
    before(() => {
        // Create the autocomplete source to test it out
        const source = `
            export default function ({ input, lib }, done) {
                lib.request.get('https://raw.githubusercontent.com/BrunnerLivio/PokemonDataGraber/master/output.json')
                    .then(res => res.body)
                    .then(pokemons => pokemons.map(pokemon => pokemon.Name))
                    .filter(name => name.startsWith(input))
                    .then(done);
            }
        `;

        process.chdir('salete-hello-world');
        return createFolder('autocomplete')
            .then(~createFile('./autocomplete/pokemon.js', source));
    });

    after(~process.chdir('..'));
};
