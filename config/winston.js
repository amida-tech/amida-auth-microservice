import winston from 'winston';

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            json: true,
            colorize: true,
        }),
        // new winston.transports.File({
        //    filename: 'combined.log',
        //    level: 'info',
        // }),
    ],
});

export default logger;
