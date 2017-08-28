/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint new-cap: 0 */
import crypto from 'crypto';
import uuid from 'uuid';

/**
 * User Schema
 */
module.exports = (sequelize, DataTypes) => {
    const hooks = {
        beforeValidate: (user) => {
            if (user.changed('password')) {
                user.salt = uuid.v4();
                user.password = crypto.pbkdf2Sync(user.password, Buffer.from(user.salt), 100000, 128, 'sha256').toString('hex');
            }
        },
    };

    const classMethods = {};

    const instanceMethods = {
        setPassword(newPassword) {
            this.salt = uuid.v4();
            this.password = crypto.pbkdf2Sync(newPassword, Buffer.from(this.salt), 100000, 128, 'sha256').toString('hex');
            return this.save();
        },

        testPassword(testPassword) {
            return crypto.pbkdf2Sync(testPassword, Buffer.from(this.salt), 100000, 128, 'sha256').toString('hex') === this.password;
        },
    };

    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(512),
            allowNull: false,
        },
        salt: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        scopes: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
        },
        resetToken: {
            type: DataTypes.STRING,
        },
        resetTime: {
            type: DataTypes.DATE,
        },
    }, {
        hooks,
        classMethods,
        instanceMethods,
    });

    return User;
};
