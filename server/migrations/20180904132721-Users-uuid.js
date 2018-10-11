
module.exports = {
    up(queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */
        return queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;').then(() => queryInterface.addColumn('Users', 'uuid',
            {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('gen_random_uuid()'),
                allowNull: false,
                unique: true,
                after: 'id',
                // primaryKey: true,
            })
          );
    },
    down(queryInterface) {
        return queryInterface.removeColumn('Users', 'uuid');
    },
};
