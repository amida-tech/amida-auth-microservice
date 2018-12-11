'use strict';

/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

module.exports = {
  up: (queryInterface, Sequelize) => {
    /** FIXME: allow three options
     * - reseed everything (nuke)
     * - if there is any User data, seed, but don't overwrite the existing user(s)
     * - do nothing
     */

    /** FIXME
     * Instead of admin/admin, create an arbitrary login at seed time,
     * print it to the log, and force the admin to re-auth
     */

    const adminUser = {
        username: 'admin',
        email: 'admin@default.com',
        password: 'admin',
        scopes: ['admin'],
    };

    return queryInterface.bulkInsert('Users', [adminUser]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
