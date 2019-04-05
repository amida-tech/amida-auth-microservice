import config from '../config/config';

// Like JSON.parse(), this function and has the ability to throw errors.
// Therefore calls to it must be wrapped in try/catch.
const logLevelGte = (checkLogLevel) => {
    // TODO: hard code this list of levels somewhere in the logger, and make the list used here the
    // exact same as the one used there.
    const validLogLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

    // TODO: Improve checking via using some sort of typing instead??
    if (validLogLevels.indexOf(checkLogLevel) === -1) {
        // eslint-disable-next-line max-len
        throw new Error(`logLevelGte(): 'checkLogLevel' is ${checkLogLevel}, but it must be one of the valid levels ('error', 'warn', 'info', 'verbose', 'debug', 'silly').`);
    }

    if (validLogLevels.indexOf(config.logLevel) >= validLogLevels.indexOf(checkLogLevel)) {
        return true;
    }

    return false;
};

export default logLevelGte;
