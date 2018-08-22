import pg from 'pg';
import config from './config/config';
import app from './config/express';
/* eslint-disable no-unused-vars */
import db from './config/sequelize';

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

const conStringPri = `postgres://${config.postgres.user}:${config.postgres.passwd}@${config.postgres.host}:${config.postgres.port}/postgres`;
pg.connect(conStringPri, (err, client, done) => { // eslint-disable-line no-unused-vars
    // create the db and ignore any errors, for example if it already exists.
    client.query(`CREATE DATABASE ${config.postgres.db}`, (err1) => { // eslint-disable-line no-unused-vars
        client.end(); // close the connection
        // db should exist now, initialize Sequelize
        db.sequelize
          .sync()
          .then(startServer)
          .catch((err2) => {
              if (err2) debug('An error occured %j', err2);
              else debug('Database synchronized');
          });
    });
});


export default app;
