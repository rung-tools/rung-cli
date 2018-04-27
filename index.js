import { create } from 'rung-sdk';

function main(context) {
    const { name } = context.params;
    return {
        alerts: [{
            title: _('Welcome'),
content: JSON.stringify(context.params),
            resources: []
        }]
    };
}

const params = {
    name: {
        description: _('What is your name?'),
        type: Text
    }
};

export default create(main, {
    params,
    primaryKey: true,
    title: _("Very Cool Project"),
    description: _("This is only a test"),
});
    
