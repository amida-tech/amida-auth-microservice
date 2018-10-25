const postgres = require('./config.js').postgres;

let config = {
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
    if (postgres.sslCaCert) {
        config.dialectOptions = {
            ssl: {
                ca: postgres.sslCaCert,
                rejectUnauthorized: true
            },
        };
    }
}

module.exports = {
    development: config,
    test: config,
    production: config,
};
