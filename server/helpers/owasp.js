import httpStatus from 'http-status';
import owasp from 'owasp-password-strength-test';
import APIError from '../helpers/APIError';

owasp.config({
    allowPassphrases: true,
    maxLength: 64,
    minLength: 8,
    minOptionalTestsToPass: 3,
});

module.exports = {
    checkPassword(req, res, next) {
        const result = owasp.test(req.body.password);
        if (!result.strong) {
            const err = new APIError(result.errors.join('\r\n'), 'STRONG_PASS_REQUIRED', httpStatus.BAD_REQUEST, true);
            return next(err);
        }
        return next();
    },
};
