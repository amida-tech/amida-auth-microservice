
import _ from 'lodash';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import db from '../../config/sequelize';
import APIError from '../helpers/APIError';
import config from '../../config/config';

const User = db.User;

/**
 * Returns jwt token if valid username and password is provided
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
        const token = jwt.sign({
            username: userResult.username,
        }, config.jwtSecret, { expiresIn: '1h' });
        return res.json({
            token,
            username: user.username,
        });
    })
    .catch(error => next(error));
}

function logout() {}

/**
 * Returns 200 OK if password was updated successfully
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function updatePassword() {}

export default { login, logout, updatePassword };
