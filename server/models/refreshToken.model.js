/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint new-cap: 0 */
import randtoken from 'rand-token';
import config from '../../config/config';

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

    RefreshToken.createNewToken = function createNewToken(uuid) {
        const refreshToken = randtoken.uid(128);

        if (!config.refreshToken.multipleDevices) {
            return this.destroy({ where: { uuid } })
            .then(() => this.create({
                token: refreshToken,
                uuid,
            }));
        }

        return this.create({
            token: refreshToken,
            uuid,
        });
    };

    return RefreshToken;
};
