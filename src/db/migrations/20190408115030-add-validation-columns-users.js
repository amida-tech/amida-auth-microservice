module.exports = {
    up(queryInterface, Sequelize) {
        /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */
        return queryInterface.addColumn('Users', 'contactMethodVerificationToken', {
            type: Sequelize.STRING,
            unique: true,
        }).then( function () {
            return queryInterface.addColumn('Users', 'contactMethodVerificationTokenExpires', {
                type: Sequelize.DATE,
            })
        }).then( function () {
            return queryInterface.addColumn('Users', 'contactMethodToVerify', {
                type: Sequelize.STRING, // eslint-disable-line new-cap
                defaultValue: '',
            })
        }).then( function () {
            return queryInterface.addColumn('Users', 'verifiedContactMethods', {
                type: Sequelize.ARRAY(Sequelize.STRING), // eslint-disable-line new-cap
                defaultValue: [],
            })
        })
    },
    down(queryInterface) {
        /*
      TODO: JRB THIS IS NOT RIGHT AND I KNOW IT. Or is it @Ryan?
      */
        return queryInterface.removeColumn('Users', 'contactMethodVerificationToken', {
            type: Sequelize.STRING,
            unique: true,
        }).then( function () {
            return queryInterface.removeColumn('Users', 'contactMethodVerificationTokenExpires', {
                type: Sequelize.DATE,
            })
        }).then( function () {
            return queryInterface.removeColumn('Users', 'contactMethodToVerify', {
                type: Sequelize.STRING, // eslint-disable-line new-cap
                defaultValue: '',
            })
        }).then( function () {
            return queryInterface.removeColumn('Users', 'verifiedContactMethods', {
                type: Sequelize.ARRAY(Sequelize.STRING), // eslint-disable-line new-cap
                defaultValue: [''],
            })
        })
    }
};
