import process from 'process';
import { expect } from 'chai';
import { keys, prop, split } from 'ramda';
import JSZip from 'jszip';
import work, {
    createFile,
    readFile,
    createFolder,
    keepCalm,
    renameFile,
    request
} from './salete';

const npm = {
    runs: ['npm', 'install'],
    does: [keepCalm(5 * 60)]
};

const compile = {
    runs: ['node', '../dist/cli.js', 'build'],
    does: [keepCalm(30)]
};

const zipInfo = path => readFile(path)
    .then(new JSZip().loadAsync(_))
    .then(prop('files') & keys);

const putSomeIcon = ~request.get('http://www.randomkittengenerator.com/cats/rotator.php')
    .then(({ body }) => createFile('icon.png', body));

export default () => {
    before(~process.chdir('salete-hello-world'));

    it.only('should compile the generated boilerplate', () => {
        return work(npm)
            .then(() => {
                void expect('node_modules').to.be.a.directory().and.not.empty;
                return work(compile);
            })
            .then(output => {
                const [warning, success] = output | split('\n');
                expect(warning).to.contain('compiling extension without providing an icon.png file');
                expect(success).to.contain('Rung extension compilation');
                expect('salete-hello-world.rung').to.be.a.file();
                return zipInfo('./salete-hello-world.rung');
            })
            .then(files => {
                expect(files).to.contain('README.md');
            });
    }).timeout(keepCalm(90));

    it('should link locales and icon to compilation', () => {
        return createFolder('locales')
            .then(() => createFile('locales/pt_BR.json', JSON.stringify({
                'Very Cool Project': 'Projeto Muito Legal'
            })))
            .tap(putSomeIcon)
            .then(~work(compile))
            .then(output => {
                expect(output).to.not.contain('compiling extension without providing an icon.png file');
                expect(output).to.contain('Rung extension compilation');
                expect('.meta').to.be.a.file().with.json.using.schema({
                    type: 'object',
                    required: ['title', 'description', 'preview', 'params'],
                    properties: {
                        title: {
                            type: 'object',
                            required: ['default', 'pt_BR'],
                            default: {
                                type: 'string'
                            },
                            pt_BR: {
                                type: 'string'
                            }
                        }
                    }
                });
            });
    }).timeout(keepCalm(30));

    it('should add a simple autocomplete file', () => {
        return createFolder('autocomplete')
            .then(~createFile('autocomplete/name.js', `
                export default function name({ input }) {
                    return [
                        'Marcelo', 'Paulo', 'Vitor', 'Larissa', 'William'
                    ].filter(name => name.startsWith(input));
                };
            `))
            .then(~work(compile));
    }).timeout(keepCalm(30));

    it('should refuse compiling when salete removes package.json', () => {
        return renameFile('package.json', 'package.hs')
            .then(~work(compile))
            .then(output => {
                expect(output).to.contain('missing package.json from the project');
            })
            .finally(~renameFile('package.hs', 'package.json'));
    }).timeout(keepCalm(30));

    after(~process.chdir('..'));
};
