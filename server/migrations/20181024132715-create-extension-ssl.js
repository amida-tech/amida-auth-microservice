
module.exports = {
    up(queryInterface) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */
        return queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS sslinfo;');
    },
    down(queryInterface) {
        return queryInterface.sequelize.query('DROP EXTENSION IF EXISTS sslinfo;');
    },
};
