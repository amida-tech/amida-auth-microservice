import _ from 'lodash';
import util from 'util';
import httpStatus from 'http-status';

import db from '../config/sequelize';
import { signJWT } from '../helpers/jwt';
import APIError from '../helpers/APIError';
import {
    sendEmail,
    generateLink,
} from '../helpers/mailer';
import config from '../config/config';

const User = db.User;
const RefreshToken = db.RefreshToken;

/**
 * Sends back jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function login(req, res, next) {
    const params = _.pick(req.body, 'username', 'password');
    const user = User.findOne({ where: { username: params.username } });
    const passwordMatch = user.then((userResult) => {
        if (_.isNull(userResult)) {
            const err = new APIError('Incorrect username or password', 'INCORRECT_USERNAME_OR_PASSWORD', httpStatus.NOT_FOUND, true);
            return next(err);
        }
        return userResult.testPassword(params.password);
    });

    // once the user and password promises resolve, send the token or an error
    Promise.join(user, passwordMatch, (userResult, passwordMatchResult) => {
        if (!passwordMatchResult) {
            const err = new APIError('Incorrect username or password', 'INCORRECT_USERNAME_OR_PASSWORD', httpStatus.NOT_FOUND, true);
            return next(err);
        }

        const userInfo = {
            id: userResult.id,
            uuid: userResult.uuid,
            username: userResult.username,
            email: userResult.email,
            scopes: userResult.scopes,
        };

        const jwtToken = signJWT(userInfo);

        if (config.refreshToken.enabled) {
            return RefreshToken.createNewToken(userResult.id)
            .then(token => res.json({
                token: jwtToken,
                uuid: user.uuid,
                username: user.username,
                refreshToken: token.token,
                ttl: config.jwtExpiresIn,
            }));
        }
        return res.json({
            token: jwtToken,
            uuid: user.uuid,
            username: user.username,
            ttl: config.jwtExpiresIn,
        });
    })
    .catch(error => next(error));
}

/**
 * Sends back jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function submitRefreshToken(req, res, next) {
    if (!config.refreshToken.enabled) {
        return res.sendStatus(httpStatus.NOT_IMPLEMENTED);
    }

    const params = _.pick(req.body, 'username', 'refreshToken');
    return User
    .findOne({ where: { username: params.username } })
    .then(userResult =>
        RefreshToken
        .findOne({ where: { token: params.refreshToken, userId: userResult.id } })
        .then((tokenResult) => {
            if (_.isNull(tokenResult)) {
                const err = new APIError('Refresh token not found', 'MISSING_REFRESH_TOKEN', httpStatus.NOT_FOUND, true);
                return next(err);
            }
            const userInfo = {
                id: userResult.id,
                uuid: userResult.uuid,
                username: userResult.username,
                email: userResult.email,
                scopes: userResult.scopes,
            };

            const jwtToken = signJWT(userInfo);

            return res.json({
                token: jwtToken,
                uuid: userResult.uuid,
                username: userResult.username,
                ttl: config.jwtExpiresIn,
            });
        }).catch(error => next(error))
    )
    .catch(error => next(error));
}

/**
 * Sends back jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function rejectRefreshToken(req, res, next) {
    if (!config.refreshToken.enabled) {
        return res.sendStatus(httpStatus.NOT_IMPLEMENTED);
    }

    const params = _.pick(req.body, 'refreshToken');
    return RefreshToken.findOne({ where: { token: params.refreshToken } })
    .then((tokenResult) => {
        if (_.isNull(tokenResult)) {
            const err = new APIError('Refresh token not found', 'MISSING_REFRESH_TOKEN', httpStatus.NOT_FOUND, true);
            return next(err);
        }
        // delete the refresh token
        tokenResult.destroy();

        return res.sendStatus(httpStatus.NO_CONTENT);
    })
    .catch(error => next(error));
}

/**
 * Sends back 200 OK if password was updated successfully
 * Sends back 403 FORBIDDEN if old password doesn't match
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function updatePassword(req, res, next) {
    const user = req.user;
    const params = _.pick(req.body, 'oldPassword', 'password');

    if (!user.testPassword(params.oldPassword)) {
        const err = new APIError('Incorrect password', 'INCORRECT_PASSWORD', httpStatus.FORBIDDEN, true);
        return next(err);
    }

    user.password = params.password;
    return user.save()
        .then(() => res.sendStatus(httpStatus.OK))
        .catch(error => next(error));
}

/**
 * Sends back 200 OK if password was reset successfully
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function resetToken(req, res, next) {
    const userLine = 'You have requested the reset of the password for your account';
    const clickLine = 'Please click on the following link, or paste into your browser:';
    const ifNotLine = 'If you or your admin did not request a reset, please ignore this email.';

    const email = _.get(req, 'body.email');
    const resetPageUrl = _.get(req, 'body.resetPageUrl');
    if (!email) {
        const err = new APIError('Invalid email', 'INVALID_EMAIL', httpStatus.BAD_REQUEST, true);
        return next(err);
    }
    return User.resetPasswordToken(email, 3600)
        .then((token) => {
            const link = generateLink(resetPageUrl, token);
            const text = util.format('%s\n%s\n%s\n\n%s\n', userLine, clickLine, link, ifNotLine);
            sendEmail(res, email, text, token, next);
        })
        .catch(error => next(error));
}

/**
 * Sends back 200 OK if password was reset successfully
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function resetPassword(req, res, next) {
    const token = _.get(req, 'params.token');
    const newPassword = _.get(req, 'body.password');
    User.resetPassword(token, newPassword)
        .then(() => {
            res.sendStatus(httpStatus.OK);
        })
        .catch(error => next(error));
}

/**
 * Sends back 200 OK if a messagingProtocolToken is created
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function verifyMessagingProtocol(req, res, next) {
    // This expects an email, and a page url to construct the verification link. It
    // uses `generateMessagingProtocolToken` to populate `messagingProtocol` token,
    // auth expiration, and provider for a user (unless an invalid email is
    // provided). Finally it uses nodemailer to dispatch an email with a
    // verification link to the user.

    // TODO: Better handle email construction.
    // TODO: Explore notification-microservice based dispatcing of messages.
    const userLine = 'An account has been created.';
    const clickLine = 'Please click on the following link to verify your account.';
    const ifNotLine = 'If you or your admin did not request a reset, please ignore this email.';

    const email = _.get(req, 'body.email');
    const messagingProtocolVerifyPageUrl = _.get(req, 'body.messagingProtocolVerifyPageUrl');
    if (!email) {
        const err = new APIError('Invalid email', 'INVALID_EMAIL', httpStatus.BAD_REQUEST, true);
        return next(err);
    }
    return User.generateMessagingProtocolToken(email, 3600)
        .then((token) => {
            const link = generateLink(messagingProtocolVerifyPageUrl, token);
            const text = util.format('%s\n%s\n%s\n\n%s\n', userLine, clickLine, link, ifNotLine);
            sendEmail(res, email, text, token, next);
        })
        .catch(error => next(error));
}

/**
 * Sends back 200 OK if a messagingProtocolToken is created
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function confirmMessagingProtocol(req, res, next) {
    // This expects a token, and password to verifiy that a user is authorized to
    // access their account. If `AUTH_SERVICE_REQUIRE_ACCOUNT_VERIFICATION` is set
    // to true, this will need to occur before a user can sign in normally. If 
    // `AUTH_SERVICE_REQUIRE_SECURE_ACCOUNT_VERIFICATION` is true, the user's
    // password will be required. Success results in a user having the contents of
    // `messagingProtocolProvider` written into the `authorizedMessagingProviders`
    // array.

    const token = _.get(req, 'body.token');
    if (config.requireSecureVerificaiton) {
        const password = _.get(req, 'body.password');
        if (!password) {
            const err = new APIError('No Password provided', 'NO_PASSWORD', httpStatus.BAD_REQUEST, true);
            return next(err);
        }
        User.verifyMessagingProtocolTokenWithCredentials(token, password)
        .then(() => {
            res.sendStatus(httpStatus.OK);
        })
        .catch(error => next(error));
    } else {
        User.verifyMessagingProtocolToken(token)
        .then(() => {
            res.sendStatus(httpStatus.OK);
        })
        .catch(error => next(error));
    }
}

export default {
    login,
    submitRefreshToken,
    rejectRefreshToken,
    updatePassword,
    resetToken,
    resetPassword,
    verifyMessagingProtocol,
    confirmMessagingProtocol
};
