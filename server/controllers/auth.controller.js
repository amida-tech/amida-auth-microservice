import _ from 'lodash';
import util from 'util';
import httpStatus from 'http-status';
import randtoken from 'rand-token';
import db from '../../config/sequelize';
import { signJWT } from '../helpers/jwt';
import APIError from '../helpers/APIError';
import {
    sendEmail,
    generateLink,
} from '../helpers/mailer';

const User = db.User;

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
            const err = new APIError('Username not found', httpStatus.NOT_FOUND, true);
            return next(err);
        }
        return userResult.testPassword(params.password);
    });

    // once the user and password promises resolve, send the token or an error
    Promise.join(user, passwordMatch, (userResult, passwordMatchResult) => {
        if (!passwordMatchResult) {
            const err = new APIError('Incorrect password', httpStatus.UNAUTHORIZED, true);
            return next(err);
        }

        const userInfo = {
            id: userResult.id,
            username: userResult.username,
            email: userResult.email,
            scopes: userResult.scopes,
        };

        const jwtToken = signJWT(userInfo);
        const refreshToken = randtoken.uid(128);

        // save the refresh token
        userResult.update({ refreshToken });

        return res.json({
            token: jwtToken,
            username: user.username,
            refreshToken,
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
    const params = _.pick(req.body, 'username', 'refreshToken');
    User.findOne({ where: {
        username: params.username,
        refreshToken: params.refreshToken,
    } })
    .then((userResult) => {
        if (_.isNull(userResult)) {
            const err = new APIError('Refresh token not found', httpStatus.NOT_FOUND, true);
            return next(err);
        }
        const userInfo = {
            id: userResult.id,
            username: userResult.username,
            email: userResult.email,
            scopes: userResult.scopes,
        };

        const jwtToken = signJWT(userInfo);
        const refreshToken = randtoken.uid(128);

        // save the refresh token
        userResult.update({ refreshToken });

        return res.json({
            token: jwtToken,
            username: userResult.username,
            refreshToken,
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
function rejectRefreshToken(req, res, next) {
    const params = _.pick(req.body, 'username', 'refreshToken');
    User.findOne({ where: {
        username: params.username,
        refreshToken: params.refreshToken,
    } })
    .then((userResult) => {
        if (_.isNull(userResult)) {
            const err = new APIError('Refresh not found', httpStatus.NOT_FOUND, true);
            return next(err);
        }
        // save the refresh token
        userResult.update({ refreshToken: null });

        return res.sendStatus(httpStatus.NO_CONTENT);
    })
    .catch(error => next(error));
}

/**
 * Sends back 200 OK if password was updated successfully
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function updatePassword(req, res, next) {
    const user = req.user;
    user.password = req.body.password;
    user.save()
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
    if (!email) {
        const err = new APIError('Invalid email', httpStatus.BAD_REQUEST, true);
        return next(err);
    }
    return User.resetPasswordToken(email, 3600)
        .then((token) => {
            const link = generateLink(req, token);
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

export default {
    login,
    submitRefreshToken,
    rejectRefreshToken,
    updatePassword,
    resetToken,
    resetPassword,
};
