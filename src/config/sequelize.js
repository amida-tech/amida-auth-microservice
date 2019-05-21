import Sequelize from 'sequelize';
import _ from 'lodash';
import config from './config';
import logger from './winston';
import { ensureConnectionIsEncrypted } from './helpers';

let dbLogging;
if (config.env === 'test') {
    dbLogging = false;
} else {
    dbLogging = msg => logger.debug(msg);
}

const db = {};

// connect to postgres db
const sequelizeOptions = {
    dialect: 'postgres',
    port: config.postgres.port,
    host: config.postgres.host,
    logging: dbLogging,
};
if (config.postgres.sslEnabled) {
    sequelizeOptions.ssl = config.postgres.sslEnabled;
    sequelizeOptions.dialectOptions = {
        ssl: {
            rejectUnauthorized: true,
        },
    };
    if (config.postgres.sslCaCert) {
        sequelizeOptions.dialectOptions.ssl.ca = config.postgres.sslCaCert;
    }
}

const sequelize = new Sequelize(
    config.postgres.db,
    config.postgres.user,
    config.postgres.password,
    sequelizeOptions
);

if (config.postgres.sslEnabled) {
    ensureConnectionIsEncrypted(sequelize);
}

db.User = sequelize.import('../db/models/user.model');
db.RefreshToken = sequelize.import('../db/models/refreshToken.model');

// assign the sequelize variables to the db object and returning the db.
module.exports = _.extend({
    sequelize,
    Sequelize,
}, db);
