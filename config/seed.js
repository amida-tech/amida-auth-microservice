/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

import {
    User,
    sequelize,
} from './sequelize';

const debug = require('debug')('amida-auth-microservice:seed');

const adminUser = {
    username: 'admin',
    email: 'admin@default.com',
    password: 'admin',
    scopes: ['admin'],
};

/** FIXME: allow three options
 * - reseed everything (nuke)
 * - if there is any User data, seed, but don't overwrite the existing user(s)
 * - do nothing
 */

/** FIXME
 * Instead of admin/admin, create an arbitrary login at seed time,
 * print it to the log, and force the admin to re-auth
 */

User.sync({ pool: false })
    .then(() => sequelize.query('DELETE FROM "Users"', {
        type: sequelize.QueryTypes.DELETE,
    }))
    .then(() => User.create(adminUser))
    .then(() => {
        debug('finished populating users');
        process.exit(0);
    })
    .catch((err) => {
        debug(err);
        process.exit(1);
    });
