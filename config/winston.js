const { configuredFormatter } = require('winston-json-formatter');

const { createLogger, transports } = require('winston');
const pjson = require('../package.json');
const config = require('./config')

const logger = createLogger({
    transports: [
        new transports.Console(),
    ],
});

const options = {
    service: 'amida-auth-service',
    name: 'application-logger',
    version: `${pjson.version}`,
    typeFormat: 'json',
};

logger.format = configuredFormatter(options);

module.exports = logger;
