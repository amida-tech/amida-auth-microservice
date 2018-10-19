
module.exports = {
    up(queryInterface) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
      */
        return queryInterface.addIndex('Users', ['uuid']);
    },
    down(queryInterface) {
        return queryInterface.removeIndex('Users', ['uuid']);
    },
};
