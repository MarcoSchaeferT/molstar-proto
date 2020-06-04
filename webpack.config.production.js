const { createApp, createExample } = require('./webpack.config.common.js');

const examples = ['proteopedia-wrapper', 'basic-wrapper', 'lighting' , 'ply-wrapper'];

module.exports = [
    createApp('viewer', 'molstar'),
    ...examples.map(createExample)
]