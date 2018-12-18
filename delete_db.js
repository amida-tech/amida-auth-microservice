import pg from 'pg';
import config from './config/config';

const conStringPri = `postgres://${config.postgres.user}:${config.postgres.password}@${config.postgres.host}:${config.postgres.port}/postgres`;

pg.connect(conStringPri, (err, client, done) => { // eslint-disable-line no-unused-vars
    client.query(`DROP DATABASE IF EXISTS "${config.postgres.db}";`, (err1) => { // eslint-disable-line no-unused-vars
        console.log('Database Deleted:', config.postgres.db);
        process.exit(0);
    });
});
