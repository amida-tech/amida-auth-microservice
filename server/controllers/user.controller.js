
import httpStatus from 'http-status';
import db from '../../config/sequelize';
import APIError from '../helpers/APIError';
import { signJWT } from '../helpers/jwt';

const User = db.User;

// TODO: refactor out the ID/email check into helper function

/**
 * Load user and append to req.
 * Used for populating requests with a userID param.
 * @param req
 * @param res
 * @param next
 * @param id
 * @returns {*}
 */
function load(req, res, next, id) {
    User.findById(id)
        .then((user) => {
            if (!user) {
                const e = new APIError('User does not exist', 'UNKNOWN_USERNAME', httpStatus.NOT_FOUND, true);
                return next(e);
            }
            req.user = user; // eslint-disable-line no-param-reassign
            return next();
        })
        .catch(e => next(e));
}

/**
 * Get info on a single user.
 * Must be admin, or the specified user.
 * Sends back JSON of the specified user.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function get(req, res, next) {
    User.findById(req.params.userId)
        .then((user) => {
            if (req.user.username !== user.username && !req.user.isAdmin()) {
                const e = new APIError('Cannot get another user\'s information', 'UNAUTHORIZED_REQUEST', httpStatus.FORBIDDEN, true);
                return next(e);
            }
            return res.json(user.getBasicUserInfo());
        })
        .catch(e => next(e));
}

/**
 * Get info on a single user.
 * Must be admin, or the specified user.
 * Sends back JSON of the specified user.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function getByEmail(req, res, next) {
    User.findOne({ where: { email: req.params.userEmail } })
        .then((user) => {
            if (!user) {
                const e = new Error('User does not exist');
                e.status = httpStatus.NOT_FOUND;
                return next(e);
            }
            if (req.user.username !== user.username && !req.user.isAdmin()) {
                const e = new APIError('Cannot get another user\'s information', 'UNAUTHORIZED_REQUEST', httpStatus.FORBIDDEN, true);
                return next(e);
            }
            return res.json(user.getBasicUserInfo());
        })
        .catch(e => next(e));
}

/**
 * Create and save a new user
 * Sends back JSON of the saved user
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function create(req, res, next) {
    const user = User.build({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        scopes: req.body.scopes,
    });

    user.save().then((savedUser) => {
        const userInfo = savedUser.getBasicUserInfo();
        userInfo.jwtToken = signJWT(userInfo);
        res.json(userInfo);
    }).catch(e => next(e));
}

function update(req, res, next) {
    User.findById(req.params.userId)
        .then((user) => {
            if (req.user.username !== user.username && !req.user.isAdmin()) {
                const e = new APIError('User not allowed to update email', 'CANNOT_UPDATE_EMAIL', httpStatus.FORBIDDEN, true);
                return next(e);
            }
            return user.update({ email: req.body.email });
        })
        .then(updatedUser => res.json(updatedUser.getBasicUserInfo()))
        .catch(e => next(e));
}

/**
 * Update authorization scopes for a given user.
 * Overwrites existing scopes array with the provided one.
 * Sends back JSON of the updated user.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function updateScopes(req, res, next) {
    User.findById(req.params.userId)
        .then(user => user.update({ scopes: req.body.scopes }))
        .then(updatedUser => res.json(updatedUser.getBasicUserInfo()))
        .catch(e => next(e));
}

/**
 * Get a full list of users.
 * Restricted to admin.
 * Sends back ID, username, and email of all users.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function list(req, res, next) {
    User.findAll({
        attributes: ['id', 'uuid', 'username', 'email'],
    })
    .then(users => res.json(users))
    .catch(e => next(e));
}

/**
 * Deletes a user.
 * Restricted to admin.
 * Sends back a 204.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function remove(req, res, next) {
    User.findById(req.params.userId)
        .then(user => user.destroy())
        .then(() => res.sendStatus(204))
        .catch(e => next(e));
}

/**
 * Assumes req.user has been loaded by the JWT middleware.
 * Sends back JSON of the logged-in user.
 * @param req
 * @param res
 * @returns {*}
 */
function me(req, res) {
    return res.json(req.user.getBasicUserInfo());
}

export default {
    load,
    get,
    getByEmail,
    create,
    update,
    updateScopes,
    list,
    remove,
    me,
};
