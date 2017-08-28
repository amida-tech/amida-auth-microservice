
import httpStatus from 'http-status';
import db from '../../config/sequelize';

const User = db.User;

/**
 * Load user and append to req.
 * Used for populating requests with a userID param.
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
 * @returns {User}
 */
function get(req, res) {
    return res.json(req.user);
}

/**
 * Create new user
 * @property {string} req.body.username - The username of the new user.
 * @property {string} req.body.email - The email of the new user.
 * @returns {User}
 */
function create(req, res, next) {
    const user = User.build({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
    });

    user.save()
        .then(savedUser => res.json(savedUser))
        .catch(e => next(e));
}

function update() {}

function list() {}

function remove() {}

function me() {}

export default {
    load,
    get,
    create,
    update,
    list,
    remove,
    me,
};
