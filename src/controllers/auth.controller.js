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

    User.findOne({ where: { username: params.username } }).then((user) => {
        const validUserAndPassword = !_.isNull(user) && user.testPassword(params.password);

        if (!validUserAndPassword) {
            const err = new APIError('Incorrect username or password', 'INCORRECT_USERNAME_OR_PASSWORD', httpStatus.NOT_FOUND, true);
            return next(err);
        }

        const userInfo = {
            id: user.id,
            uuid: user.uuid,
            username: user.username,
            email: user.email,
            scopes: user.scopes,
            verifiedContactMethods: user.verifiedContactMethods,
        };

        // check to see if the user needs to be verified to sign in, and if they are verified
        if ((config.requireVerificaiton || config.requireSecureVerificaiton) &&
            !userInfo.verifiedContactMethods.includes(userInfo.email)) {
            const err = new APIError('User is not Verified', 'USER_IS_NOT_VERIFIED', httpStatus.NOT_FOUND, true);
            return next(err);
        }

        const jwtToken = signJWT(userInfo);

        if (config.refreshToken.enabled) {
            return RefreshToken.createNewToken(user.id)
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
    const email = _.get(req, 'body.email');
    const user = User.findOne({ where: { username: email } });
    const resetPageUrl = _.get(req, 'body.resetPageUrl');

    if (!email) {
        const err = new APIError('Invalid email', 'INVALID_EMAIL', httpStatus.BAD_REQUEST, true);
        return next(err);
    }
    // once the user promise resolves, send the token or an error
    Promise.join(user, (userResult) => {
        if (userResult &&
            (config.requireVerificaiton || config.requireSecureVerificaiton) &&
            !userResult.isVerified()) {
            const err = new APIError('User Not Verified or does not exist.', 'INVALID_EMAIL', httpStatus.BAD_REQUEST, true);
            return next(err);
        }
        return User.resetPasswordToken(email, 3600)
            .then((token) => {
                const resetLink = generateLink(resetPageUrl, token);
                const resetDomain = resetPageUrl.replace(/(^\w+:|^)\/\//, '').split('/')[0];
                const subject = `Reset your password for ${resetDomain}`;
                const body = [
                    `${email},`,
                    `A request to reset your password on ${resetDomain} was recieved.`,
                    `You can reset your account password using the following link: ${resetLink}`,
                    'If you believe this message was sent in error, please disregard this message.',
                ];
                const text = util.format('%s\n\n%s\n\n%s\n\n%s', ...body);
                const attributes = { token };
                sendEmail(res, email, subject, text, attributes, next);
            })
        .catch(error => next(error));
    });

    return true;
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
 * Sends back 200 OK if a contactMethodVerificationToken is created
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function dispatchVerificaitonRequest(req, res, next) {
    // This expects an email, and a page url to construct the verification link. It
    // uses `verifyAccountToken` to populate `messagingProtocol` token,
    // auth expiration, and provider for a user (unless an invalid email is
    // provided). Finally it uses nodemailer to dispatch an email with a
    // verification link to the user.

    // TODO: Better handle email construction.
    // TODO: Explore notification-microservice based dispatcing of messages.
    //       * JRB: This probably helps us verify via more protocols, such as SMS or
    //              push notification.
    const email = _.get(req, 'body.email');
    const messagingProtocolVerifyPageUrl = _.get(req, 'body.messagingProtocolVerifyPageUrl');

    if (!email) {
        const err = new APIError('Invalid email', 'INVALID_EMAIL', httpStatus.BAD_REQUEST, true);
        return next(err);
    }
    return User.verifyAccountToken(email, 3600)
        .then((token) => {
            const verificationLink = generateLink(messagingProtocolVerifyPageUrl, token);
            const verificationDomain = messagingProtocolVerifyPageUrl.replace(/(^\w+:|^)\/\//, '').split('/')[0];
            const subject = `Verify your email address for ${verificationDomain}`;
            const body = [
                `${email},`,
                `An account has been created for you on ${verificationDomain}.`,
                `You ${config.requireVerificaiton || config.requireSecureVerificaiton ? 'are required' : 'are recommened'} to verify your email address${config.requireSecureVerificaiton && ' (using your password) in order to continue'}.`,
                `Please verify your email address by going to the following link: ${verificationLink}`,
                'If you believe this message was sent in error, please disregard this message.',
            ];
            const text = util.format('%s\n\n%s\n\n%s\n\n%s\n\n%s', ...body);
            const attributes = { token };
            // Format doesn't seem like the best solution here...
            sendEmail(res, email, subject, text, attributes, next);
        })
        .catch(error => next(error));
}

/**
 * Sends back 200 OK if a contactMethodVerificationToken is created
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function provideVerifyingUser(req, res, next) {
    // This expects a `contactMethodVerificationToken` token, and returns the username of
    // the identifying user. Only required if auth-micrservice is configured to
    // only accept conformMessaingProtocol tokens if they are provided with a
    // user's login credentials.

    const token = _.get(req, 'body.token');
    if (!token) {
        const err = new APIError('Invalid Token', 'INVALID_TOKEN', httpStatus.BAD_REQUEST, true);
        return next(err);
    }

    return User.getVerifyingUser(token)
        .then((usernameResult) => {
            if (_.isNull(usernameResult)) {
                const err = new APIError('User not found', 'MISSING_REFRESH_TOKEN', httpStatus.NOT_FOUND, true);
                return next(err);
            }
            return res.json({
                username: usernameResult,
            });
        })
        .catch(error => next(error));
}

/**
 * Sends back 200 OK if a contactMethodVerificationToken is created
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function verifyMessagingProtocol(req, res, next) {
    // This expects a token, and optional password to verifiy that a user is
    // authorized to access their account. If
    // `AUTH_SERVICE_REQUIRE_ACCOUNT_VERIFICATION` is set to true, verification
    // will need to occur before a user can sign authenticate normally. If
    // `AUTH_SERVICE_REQUIRE_SECURE_ACCOUNT_VERIFICATION` is true, the user's
    // password will be handeled as a required param. Success results in a user
    // having the contents of `contactMethodToVerify` written into the
    // `verifiedContactMethods` array.

    const token = _.get(req, 'body.token');
    if (config.requireSecureVerificaiton) {
        const password = _.get(req, 'body.password');
        if (!password) {
            const err = new APIError('No Password provided', 'NO_PASSWORD', httpStatus.BAD_REQUEST, true);
            return next(err);
        }
        return User.secureVerifyUserAccount(token, password)
            .then(() => {
                res.sendStatus(httpStatus.OK);
            })
            .catch(error => next(error));
    }
    return User.verifyUserAccount(token)
        .then(() => {
            res.sendStatus(httpStatus.OK);
        })
        .catch(error => next(error));
}

export default {
    login,
    submitRefreshToken,
    rejectRefreshToken,
    updatePassword,
    resetToken,
    resetPassword,
    dispatchVerificaitonRequest,
    provideVerifyingUser,
    verifyMessagingProtocol,
};
