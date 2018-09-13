import pg from 'pg';
import config from './config/config';

const conStringPri = `postgres://${config.postgres.user}:${config.postgres.password}@${config.postgres.host}:${config.postgres.port}/postgres`;

pg.connect(conStringPri, (err, client, done) => { // eslint-disable-line no-unused-vars
    // create the db and ignore any errors, for example if it already exists.
    client.query(`CREATE DATABASE ${config.postgres.db}`, (err1) => { // eslint-disable-line no-unused-vars
        // If in test mode and a database exists don't let it get created
        if (err1) {
            console.log(`Database Creation Failed. Please check to see if the database "${config.postgres.db}" already exists if so please delete it`);
            process.exit(1);
        } else {
            console.log('Database Creation Succeded');
            process.exit(0);
        }
    });
});
