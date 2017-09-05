/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint new-cap: 0 */
import crypto from 'crypto';
import moment from 'moment';
import uuid from 'uuid';

/**
 * User Schema
 */
module.exports = (sequelize, DataTypes) => {
    const randomBytes = sequelize.Promise.promisify(crypto.randomBytes, {
        context: crypto,
    });

    const hooks = {
        beforeValidate: (user) => {
            if (user.changed('password')) {
                user.salt = uuid.v4();
                user.password = crypto.pbkdf2Sync(user.password, Buffer.from(user.salt), 100000, 128, 'sha256').toString('hex');
            }
        },
    };

    const classMethods = {
        resetPasswordToken(email, expTime) {
            return this.find({
                where: {
                    email,
                },
            })
            .then((user) => {
                if (!user) {
                    const err = new Error('Email not found');
                    return sequelize.Promise.reject(err);
                }
                return user.updateResetPasswordToken(expTime);
            });
        },

        resetPassword(token, newPassword) {
            const rejection = () => {
                const err = new Error('Password reset token is invalid or has expired.');
                return sequelize.Promise.reject(err);
            };
            return this.find({
                where: {
                    resetToken: token,
                },
            }).then((user) => {
                if (!user) {
                    return rejection();
                }
                const expires = user.resetExpires;
                const mExpires = moment.utc(expires);
                if (moment.utc().isAfter(mExpires)) {
                    return rejection();
                }
                user.password = newPassword;
                return user.save();
            });
        },
    };

    const instanceMethods = {
        testPassword(testPassword) {
            return crypto.pbkdf2Sync(testPassword, Buffer.from(this.salt), 100000, 128, 'sha256').toString('hex') === this.password;
        },

        updateResetPasswordToken(expTime) {
            return randomBytes(20)
                .then((buf) => {
                    const token = buf.toString('hex');
                    return token;
                }).then(token => randomBytes(10).then(password => ({
                    token,
                    password,
                }))).then((tokens) => {
                    this.resetToken = tokens.token;
                    this.password = tokens.password;
                    const m = moment.utc();
                    m.add(expTime, 'seconds');
                    this.resetExpires = m.format();
                    return this.save().then(() => tokens.token);
                });
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
        resetExpires: {
            type: DataTypes.DATE,
        },
    }, {
        hooks,
        classMethods,
        instanceMethods,
    });

    return User;
};
