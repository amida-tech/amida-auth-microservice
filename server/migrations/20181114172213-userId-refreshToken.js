
module.exports = {
    up(queryInterface) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */
        return queryInterface.sequelize.query('ALTER TABLE "refreshToken" ADD COLUMN IF NOT EXISTS "userId" INTEGER;');
    },
    down(queryInterface) {
        return true;
    },
};
