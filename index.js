import config from './config/config';
import app from './config/express';
/* eslint-disable no-unused-vars */
import db from './config/sequelize';
import logger from './config/winston';
import passGenerator from './config/password-generator';

const debug = require('debug')('amida-auth-microservice:index');
/* eslint-enable no-unused-vars */

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

function startServer() {
  // module.parent check is required to support mocha watch
    if (!module.parent) {
    // listen on port config.port
        app.listen(config.port, () => {
            debug(`server started on port ${config.port} (${config.env})`);
        });
    }
}

db.sequelize
  .sync()
  .then(() => {
      db.User.count().then((total) => {
          if (total === 0) {
              logger.info('Admin user not found. Creating.');
              const adminUser = Object.assign({}, config.adminUser);
              adminUser.password = passGenerator();
              logger.info(`Admin user password: ${adminUser.password}`);
              db.User.build(adminUser).save();
          }
      });
  })
  .then(startServer)
  .catch((err) => {
      if (err) debug('An error occured %j', err);
      else debug('Database synchronized');
  });

export default app;
