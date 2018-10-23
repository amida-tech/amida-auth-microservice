
module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable('Users', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false,
        },
        email: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false,
        },
        password: {
            type: Sequelize.STRING(512),
        },
        salt: {
            type: Sequelize.STRING,
        },
        scopes: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            defaultValue: [''],
        },
        refreshToken: {
            type: Sequelize.STRING,
        },
        resetToken: {
            type: Sequelize.STRING,
        },
        resetExpires: {
            type: Sequelize.DATE,
        },
        provider: {
            type: Sequelize.STRING,
            allowNull: true,
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
    }),
    down(queryInterface, Sequelize) {
        return true;
    },
    // down: (queryInterface, Sequelize) => queryInterface.dropTable('Users'),
};
