import { initLogLevelGte } from 'winston-json-formatter';
import config from '../config/config';

// Read https://www.joyent.com/node-js/production/design/errors to understand the difference between
// "programmer errors" (i.e. bugs) and "operational errors" (i.e. not actual bugs).
// The APIError class assumes that if it was instantiated without a causal error, then it is being
// used to define an "operational error", and there is no actual "programmer error"/bug.

const alwaysIncludeErrorStacks = config.alwaysIncludeErrorStacks;

// Errors thrown by 3rd party libraries might log data that we pass into them, such as PHI or PII.
// And, devs might pass those errors as the causalError arg into APIError. So, to prevent accidental
// logging of PHI/PII, only include and thus log causal errors if your config.logLevel is >= debug.
const logLevelGte = initLogLevelGte(config.logLevel);
const includeCausalError = logLevelGte('debug');

/**
 * @extends Error
 */
class APIError extends Error {
    /* eslint-disable max-len */
    /**
     * Create an APIError.
     * @param {Error | string} arg1 - Either JS Error (the causal error) (optional), or error message (required).
     * @param {string} arg2 - Either error message (required) or error code (required).
     * @param {string | Number} arg3 - Either error code (required) or HTTP status (required)
     * @param {Number | Object} arg4 - Either HTTP status (required) or options object (optional)
     * @param {Object} arg5 - Options object (optional)
     * @returns APIError
     * @example new APIError('Create user failed. Please provide a username.', 'CREATE_USER_FAILED', 400, { includeStack: true })
     * @example if (err) { new APIError(err, 'Create user failed. User already exists.', 'CREATE_USER_FAILED', 409, { isPublic: false }) }
     */
    /* eslint-enable max-len */
    constructor(arg1, arg2, arg3, arg4, arg5) {
        if (!(typeof arg1 === 'string' || arg1 instanceof String || arg1 instanceof Error)) {
            // eslint-disable-next-line max-len
            throw new Error('Attempting to run APIError constructor failed: The first arg to the constructor must be a string or object that is instanceof Error.');
        }

        // eslint-disable-next-line one-var,one-var-declaration-per-line
        let causalError, message, code, status, options;

        if (typeof arg1 === 'string' || arg1 instanceof String) {
            causalError = undefined;
            message = arg1;
            code = arg2;
            status = arg3;
            options = arg4;
        } else {
            causalError = arg1;
            message = arg2;
            code = arg3;
            status = arg4;
            options = arg5;
        }

        // Default to empty object to prevent "Cannot read property 'X' of undefined" errors.
        if (!options) {
            options = {};
        }

        // If there is no causal error, assume this is an "operational error" (see comment above).
        // (Define isOperational here because it must be used before the constructor, and therefore
        // before this.isOperational is available for use.)
        let isOperational = !causalError;

        // `options.isOperational` can override the default isOperational behavior.
        if (options.isOperational !== undefined) {
            isOperational = options.isOperational;
        }

        // eslint-disable-next-line no-underscore-dangle
        const _includeCausalError = includeCausalError || options.includeCausalError;

        // eslint-disable-next-line no-underscore-dangle
        let _message;
        if (_includeCausalError && causalError && causalError.message) {
            _message = `${message}: ${causalError.message}`;
        } else {
            _message = message;
        }

        super(_message);

        this.message = _message;
        this.code = code;
        this.status = status;
        this.options = options;
        this.isOperational = isOperational;

        // When this.isPublic is truthy, the server's response body will include the error "code"
        // and "message".
        // We want isPublic to default to true. The reason is that most of the time we do want the
        // code and message to be returned to the client rather than hidden, and we don't want to
        // have to specify isPublic every time we create a new error. In fact, the primary purpose
        // of the "code" is to support the front end's needs.
        this.isPublic = (options.isPublic === undefined ? true : options.isPublic);

        // See comments at top of file about logging of causal errors.
        if (_includeCausalError) {
            this.cause = causalError;
        }

        // This class extends Error, so this.stack gets automatically generated; however we don't
        // always want a stack, so we have to do something with it.
        // We don't want a stack trace when there is an operational error because we don't want to
        // mislead future developer maintainers into thinking there's a bug when there isn't.
        // We only want this.stack when this class is being used for a "programmer error" OR if we
        // override this behavior and always have stacks.
        if (!(alwaysIncludeErrorStacks || options.includeStack || !this.isOperational)) {
            delete this.stack;
        }
    }
}

export default APIError;
