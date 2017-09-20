
import httpStatus from 'http-status';
import db from '../../config/sequelize';

const User = db.User;

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
                const e = new Error('User does not exist');
                e.status = httpStatus.NOT_FOUND;
                return next(e);
            }
            req.user = user; // eslint-disable-line no-param-reassign
            return next();
        })
        .catch(e => next(e));
}

/**
 * Get user
 * Sends back JSON of the specified user
 * @param req
 * @param res
 * @returns {*}
 */
function get(req, res) {
    return res.json(req.user);
}

/**
 * Create and save a new user
 * Sends back JSON of the saved user
 * TODO: this should return a virtual, omitting sensitive info
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

    user.save()
        .then(savedUser => res.json(savedUser))
        .catch(e => next(e));
}

function update() {}

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
        .then(updatedUser => res.json(updatedUser))
        .catch(e => next(e));
}

function list() {}

function remove() {}

function me() {}

export default {
    load,
    get,
    create,
    update,
    updateScopes,
    list,
    remove,
    me,
};
