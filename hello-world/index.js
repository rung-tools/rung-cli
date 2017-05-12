const { create } = require('rung-sdk');
const { String: Text } = require('rung-sdk/dist/types');

function main(context) {
    const { name } = context.params;
    return [`Hello, ${name}!`];
}

const params = {
    name: {
        description: 'What is your name?',
        type: Text
    }
};

const app = create(main, { params });
module.exports = app;
    
