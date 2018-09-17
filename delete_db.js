import pg from 'pg';
import config from './config/config';

const conStringPri = `postgres://${config.postgres.user}:${config.postgres.password}@${config.postgres.host}:${config.postgres.port}/postgres`;

pg.connect(conStringPri, (err, client, done) => { // eslint-disable-line no-unused-vars
    client.query(`DROP DATABASE ${config.postgres.db}`, (err1) => { // eslint-disable-line no-unused-vars
        console.log('Database Deleted');
        process.exit(0);
    });
});
