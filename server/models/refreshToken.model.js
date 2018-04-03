/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint new-cap: 0 */
import randtoken from 'rand-token';

/**
 * User Schema
 */
module.exports = (sequelize, DataTypes) => {
    const RefreshToken = sequelize.define('RefreshToken', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        token: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
    });

    RefreshToken.createNewToken = function createNewToken(userId) {
        const refreshToken = randtoken.uid(128);
        return this.create({
            token: refreshToken,
            userId,
        });
    };

    return RefreshToken;
};
