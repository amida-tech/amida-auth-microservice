import pg from 'pg';
import config from './config/config';
import logger from './config/winston';

const conStringPri = `postgres://${config.postgres.user}:${config.postgres.password}@${config.postgres.host}:${config.postgres.port}/postgres`;

pg.connect(conStringPri, (err, client, done) => { // eslint-disable-line no-unused-vars
    client.query(`DROP DATABASE IF EXISTS ${config.postgres.db}`, (err1) => { // eslint-disable-line no-unused-vars
        logger.info({
            message: 'Database Deleted',
        });
        process.exit(0);
    });
});
