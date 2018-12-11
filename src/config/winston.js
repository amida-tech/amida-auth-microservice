const config = require('./config');

const { createLogger, transports, format } = require('winston');

const { printf, timestamp, combine, colorize } = format;

const logger = createLogger({
    level: config.logLevel,
    transports: [
        new transports.Console(),
    ],
});

const developmentFormat = printf(info => `${info.timestamp} ${info.level}: ${info.message}`);

if (config.env !== 'production') {
    logger.format = combine(
        timestamp(),
        colorize(),
        developmentFormat
    );
}

module.exports = logger;
