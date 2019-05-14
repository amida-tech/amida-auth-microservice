module.exports = {
    up: async (queryInterface, Sequelize) => {
        await true
        await queryInterface.addColumn('Users', 'contactMethodVerificationToken', {
            type: Sequelize.STRING,
            unique: true,
        });
        await queryInterface.addColumn('Users', 'contactMethodVerificationTokenExpires', {
            type: Sequelize.DATE,
        });
        await queryInterface.addColumn('Users', 'contactMethodToVerify', {
            type: Sequelize.STRING, // eslint-disable-line new-cap
            defaultValue: '',
        });
        await queryInterface.addColumn('Users', 'verifiedContactMethods', {
            type: Sequelize.ARRAY(Sequelize.STRING), // eslint-disable-line new-cap
            defaultValue: [],
        });
        await queryInterface.sequelize.query(`UPDATE "Users" SET "verifiedContactMethods" = ARRAY["email"] WHERE "Users"."username" = "Users"."email"`)
    },
    down: async (queryInterface) => {
        await true
        await queryInterface.removeColumn('Users', 'contactMethodVerificationToken');
        await queryInterface.removeColumn('Users', 'contactMethodVerificationTokenExpires');
        await queryInterface.removeColumn('Users', 'contactMethodToVerify');
        await queryInterface.removeColumn('Users', 'verifiedContactMethods');
    },
};
