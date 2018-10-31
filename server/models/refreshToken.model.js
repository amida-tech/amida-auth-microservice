/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint new-cap: 0 */
import randtoken from 'rand-token';
import config from '../../config/config';

/**
 * User Schema
 */
module.exports = (sequelize, DataTypes) => {
    const RefreshToken = sequelize.define('refreshToken', {
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
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        },
    }, {
        freezeTableName: true,
    });

    RefreshToken.createNewToken = function createNewToken(userId) {
        const refreshToken = randtoken.uid(128);

        if (!config.refreshToken.multipleDevices) {
            return this.destroy({ where: { userId } })
            .then(() => this.create({
                token: refreshToken,
                userId,
            }));
        }
        return this.create({
            token: refreshToken,
            userId,
        }).catch(err => err);
    };

    return RefreshToken;
};
