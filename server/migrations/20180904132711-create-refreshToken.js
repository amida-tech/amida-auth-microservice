'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('refreshToken', {
      id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
      },
      token: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false,
      },
      createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('refreshToken');
  }
};
