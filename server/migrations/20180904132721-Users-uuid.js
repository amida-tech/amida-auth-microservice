
module.exports = {
    up: function (queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */
        return queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;').then(function() {
            return queryInterface.addColumn('Users','uuid',
            {
                  type: Sequelize.UUID,
        					defaultValue: Sequelize.literal('gen_random_uuid()'),
        					allowNull: false,
                  unique: true,
                  primaryKey: true,
              });
        });
    },
    down: function (queryInterface, Sequelize) {
    	 return queryInterface.removeColumn('Users', 'uuid');
    }
};
