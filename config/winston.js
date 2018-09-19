import config from './config';

const { createLogger, transports, format } = require('winston');

const { printf, timestamp, combine, colorize } = format;

const logger = createLogger({
    level: 'info',
    transports: [
        new transports.Console(),
    ],
});

const developmentFormat = printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
})

if (config.env !== 'production') {
    logger.format = combine(
        timestamp(),
        colorize(),
        developmentFormat
    );
}

export default logger;
