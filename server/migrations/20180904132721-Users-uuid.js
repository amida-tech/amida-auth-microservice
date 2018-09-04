
module.exports = {
    // up: function(queryInterface, Sequelize) {
    up: (queryInterface, Sequelize, done) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */

        queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;').then(results => queryInterface.addColumn(
    				'Users',
    				'uuid',
    				{
    					type: Sequelize.UUID,
    					defaultValue: Sequelize.literal('gen_random_uuid()'),
    					allowNull: false,
                unique: true,
                primaryKey: true,
    				}
    			))
        .nodeify(done);
    },
    down: (queryInterface, Sequelize, done) => queryInterface.removeColumn('Users', 'uuid').nodeify(done),
};
