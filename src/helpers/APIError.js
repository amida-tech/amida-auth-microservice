import logLevelGte from './logLevelGte';
import config from '../config/config';

const includeCausalError = logLevelGte('debug');
const alwaysIncludeErrorStacks = config.alwaysIncludeErrorStacks;

/**
 * @extends Error
 */
class APIError extends Error {
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

        // Errors thrown by libraries we use might accidentally log data we pass into them,
        // such as PHI or PII. Therefore, when the log level is less than debug, don't
        // prepend this error's message with the causal/root error's message.
        // eslint-disable-next-line no-underscore-dangle
        let _message;
        if (includeCausalError && causalError && causalError.message) {
            _message = `${message}: ${causalError.message}`;
        } else {
            _message = message;
        }

        super(_message);

        this.message = _message;
        this.code = code;
        this.status = status;

        // Default to empty object in order to prevent "Cannot access X of undefined" errors.
        if (!options) {
            options = {};
        }

        // This class assumes that IF it was instantiated without a causal error, THEN this class is
        // being used to define an "operational error", and there is no actual "programmer error",
        // AKA bug (https://www.joyent.com/node-js/production/design/errors).
        this.isOperational = !causalError;
        if (options.isOperational !== undefined) {
            this.isOperational = options.isOperational;
        }

        // When this.isPublic is truthy, the server's response body will include the error "code"
        // and "message".
        // We want isPublic to default to true. The reason is that most of the time we do want the
        // code and message to be returned to the client rather than hidden, and we don't want to
        // have to specify isPublic every time we create a new error. In fact, the primary purpose
        // of the "code" is to support the front end's needs.
        if (options.isPublic !== false) {
            options.isPublic = true;
        }
        this.isPublic = options.isPublic;
        this.options = options;

        // Errors thrown by various libraries we use might accidentally log data we pass into them
        // when we call them, such as PHI or PII. Therefore, for example, you can set the value of
        // includeCausalError based on log level. For example, when log level is less than debug,
        // don't nest the causal error inside this error.
        if (this.isOperational || includeCausalError) {
            this.cause = causalError;
        }

        // This class extends Error, so this.stack gets automatically generated; we don't always
        // want a stack, so we have to do something with it.
        // We don't want a stack trace when there is an operational error because we don't want to
        // mislead future developer maintainers into thinking there's a bug, when there isn't.
        // We only want this.stack when this class is being used for a "programmer error" OR if we
        // override this behavior and always have stacks.
        if (!(!this.isOperational || alwaysIncludeErrorStacks || options.includeStack)) {
            delete this.stack;
        }
    }
}

export default APIError;
