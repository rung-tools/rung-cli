import { create } from 'rung-sdk';
import { String as Text } from 'rung-sdk/dist/types';
import world from './sub/world.js';

function main(context) {
    const { name } = context.params;
    return {
        alerts: [{ title: `Hello ${world}! Welcome ${name}!` }]
    };
}

export default create(main, {
    params: {
        name: {
            type: Text,
            description: 'What is your name?',
            required: true
        }
    },
    primaryKey: true,
    title: 'Hello world!',
    description: 'Hello world example'
});
