const config = require('./config').development;

console.log(config);

module.exports = {
    development: config,
    test: config,
    production: config,
};
