const { configuredFormatter } = require('winston-json-formatter');

const { createLogger, transports } = require('winston');

const logger = createLogger({
    transports: [
        new transports.Console(),
    ],
});

const options = {
    service: 'test-service',
    name: 'Winston-JSON-Formatter',
    version: '1.0.0',
    typeFormat: 'json',
};

logger.format = configuredFormatter({}, options);

logger.error('message');
logger.warn('message');
logger.info('message');
logger.verbose('message');
logger.debug('message');
logger.silly('message');

module.exports = logger;
