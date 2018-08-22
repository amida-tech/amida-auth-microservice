import Sequelize from 'sequelize';
import _ from 'lodash';
import uuid from 'uuid';
import config from './config';

let dbLogging;
if (config.env === 'test') {
    dbLogging = false;
} else {
    dbLogging = console.log;
}

const db = {};

// connect to postgres db
const sequelizeOptions = {
    dialect: 'postgres',
    port: config.postgres.port,
    host: config.postgres.host,
    logging: dbLogging,
};
if (config.postgres.ssl) {
    sequelizeOptions.ssl = config.postgres.ssl;
    if (config.postgres.ssl_ca_cert) {
        sequelizeOptions.dialectOptions = {
            ssl: {
                ca: config.postgres.ssl_ca_cert,
            },
        };
    }
}

const adminUser = {
    username: 'admin',
    email: 'admin@default.com',
    password: 'aDmin17$',
    scopes: ['admin'],
};

const sequelize = new Sequelize(
    config.postgres.db,
    config.postgres.user,
    config.postgres.passwd,
    sequelizeOptions
);

db.User = sequelize.import('../server/models/user.model');
sequelize.authenticate()
    .then(() => {
        db.User.findOne({ where: { email: adminUser.email } })
            .then((user) => {
                if (!user) {
                    console.log('adminUser not found. Creating.');
                    adminUser.password += uuid.v4(); // Need stronger password generator.
                    console.log(adminUser.password); // Need to fire to log instead.
                    db.User.build(adminUser).save();
                } else {
                    console.log('adminUser found.');
                }
            });
    });
db.RefreshToken = sequelize.import('../server/models/refreshToken.model');
db.RefreshToken.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id' });

// assign the sequelize variables to the db object and returning the db.
module.exports = _.extend({
    sequelize,
    Sequelize,
}, db);
