const Sequelize = require('sequelize');
const postgres = require('./config.js').postgres;
const { ensureConnectionIsEncrypted } = require('./helpers');

const config = {
    username: postgres.user,
    password: postgres.password,
    database: postgres.db,
    host: postgres.host,
    port: postgres.port,
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
    logging: true,
};

if (postgres.sslEnabled) {
    config.ssl = postgres.sslEnabled;
    config.dialectOptions = {
        ssl: {
            rejectUnauthorized: true,
        },
    };
    if (postgres.sslCaCert) {
        config.dialectOptions.ssl.ca = postgres.sslCaCert;
    }
}

// TODO ARH: This sequelize instance, using the config defined in this file,
// exists only to check if this config results an a properly encrypted connection to Postgres.
// The proper way to do it is to consolidate sequelize.js and database.js (this file) such that
// they use the same sequelize instance. This is documented in ORANGE-897.
const sequelize = new Sequelize(config);

if (postgres.sslEnabled) {
    ensureConnectionIsEncrypted(sequelize);
}

module.exports = {
    development: config,
    test: config,
    production: config,
};
