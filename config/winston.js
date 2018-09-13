const { createLogger, format, transports } = require('winston');
const { combine, label } = format;

const logger = createLogger({
    level: 'info',
    transports: [
        new transports.Console(),
    ],
});
export default logger;
