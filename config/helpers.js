// This file must not use anything that requires babel compilation because its
// contents run without babel in some cases, such as when doing DB migrations.

const logger = require('./winston');

function ensureConnectionIsEncrypted(sequelize) {
    sequelize.query('select 1 as "dummy string"', {
        type: sequelize.QueryTypes.SELECT,
    })
    .then(() => {
        logger.info('Sequelize is not throwing SSL-related errors, so we assume SSL is configured correctly.');
    })
    .catch((err) => {
        if (err.message === 'self signed certificate in certificate chain') {
            logger.error(`Sequelize is throwing error "${err.message}", which it does seemingly any time the certificate is invalid. Ensure your MESSAGING_SERVICE_PG_CA_CERT is set correctly.`);
        } else {
            logger.error(`Error attempting to verify the sequelize connection is SSL encrypted: ${err.message}`);
        }
        process.exit(1);
    });
}

module.exports = {
    ensureConnectionIsEncrypted,
};
