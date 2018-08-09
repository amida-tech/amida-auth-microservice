import httpStatus from 'http-status';

/**
 * @extends Error
 */
class ExtendableError extends Error {
    constructor(message, code, status, isPublic) {
        super(message);
        this.name = this.constructor.name;
        this.message = { status: 'ERROR', message, code };
        this.code = code;
        this.status = status;
        this.isPublic = isPublic;
        this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
        Error.captureStackTrace(this, this.constructor.name);
    }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIError extends ExtendableError {

    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     * @param {boolean} isPublic - Whether the message should be visible to user or not.
     */
    constructor(message, code, status = httpStatus.INTERNAL_SERVER_ERROR, isPublic = false) {
        super(message, code, status, isPublic);
    }
}

export default APIError;
