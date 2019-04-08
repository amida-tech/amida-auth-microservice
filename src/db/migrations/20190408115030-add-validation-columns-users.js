module.exports = {
    up(queryInterface, Sequelize) {
        /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */
        return queryInterface.addColumn('Users', 'messagingProtocolToken', {
            type: Sequelize.STRING,
            unique: true,
        }).then( function () {
            return queryInterface.addColumn('Users', 'messagingProtocolAuthorizationExpires', {
                type: Sequelize.DATE,
            })
        }).then( function () {
            return queryInterface.addColumn('Users', 'messagingProtocolProvider', {
                type: Sequelize.STRING, // eslint-disable-line new-cap
                defaultValue: '',
            })
        }).then( function () {
            return queryInterface.addColumn('Users', 'authorizedMessagingProviders', {
                type: Sequelize.ARRAY(Sequelize.STRING), // eslint-disable-line new-cap
                defaultValue: [''],
            })
        })
    },
    down(queryInterface) {
        /*
      TODO: JRB THIS IS NOT RIGHT AND I KNOW IT
      */
        return queryInterface.removeColumn('Users', 'messagingProtocolToken', {
            type: Sequelize.STRING,
            unique: true,
        }).then( function () {
            return queryInterface.removeColumn('Users', 'messagingProtocolAuthorizationExpires', {
                type: Sequelize.DATE,
            })
        }).then( function () {
            return queryInterface.removeColumn('Users', 'messagingProtocolProvider', {
                type: Sequelize.STRING, // eslint-disable-line new-cap
                defaultValue: '',
            })
        }).then( function () {
            return queryInterface.removeColumn('Users', 'authorizedMessagingProviders', {
                type: Sequelize.ARRAY(Sequelize.STRING), // eslint-disable-line new-cap
                defaultValue: [''],
            })
        })
    }
};
