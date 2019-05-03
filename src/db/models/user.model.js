/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint new-cap: 0 */
import crypto from 'crypto';
import moment from 'moment';
import uuid from 'uuid/v4';

/**
 * User Schema
 */
module.exports = (sequelize, DataTypes) => {
    const randomBytes = sequelize.Promise.promisify(crypto.randomBytes, {
        context: crypto,
    });

    const hooks = {
        beforeCreate(user) {
            // used to skip passwords for external auth services
            if (user.provider === undefined) {
                return user.updatePassword();
            }
            return null;
        },
        beforeUpdate(user) {
            if (user.changed('password')) {
                return user.updatePassword();
            }
            return null;
        },
    };

    // TODO: change the paradigm to link to an external provider
    // TODO: consider creating an audit trail,
    // or at least making it easy through elasticsearch
    const User = sequelize.define('User', {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
        },
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
        },
        salt: {
            type: DataTypes.STRING,
        },
        scopes: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [''],
        },
        refreshToken: {
            type: DataTypes.STRING,
        },
        resetToken: {
            type: DataTypes.STRING,
        },
        resetExpires: {
            type: DataTypes.DATE,
        },
        contactMethodVerificationToken: {
            type: DataTypes.STRING,
        },
        contactMethodVerificationTokenExpires: {
            type: DataTypes.DATE,
        },
        contactMethodToVerify: {
            type: DataTypes.STRING,
        },
        verifiedContactMethods: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
        },
        provider: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        hooks,
        indexes: [
            {
                fields: ['uuid'],
            },
            {
                fields: ['username'],
            },
        ],
    });

    // Class methods
    User.resetPasswordToken = function resetPasswordToken(email, expTime) {
        return this.find({
            where: {
                email,
            },
        })
        .then((user) => {
            if (!user) {
                const err = new Error('Email not found');
                return sequelize.Promise.reject(err);
            } else if (user.provider !== null) {
                const err = new Error('Cannot reset password on externally managed account');
                return sequelize.Promise.reject(err);
            }
            return user.updateResetPasswordToken(expTime);
        });
    };

    User.resetPassword = function resetPassword(token, newPassword) {
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
    };

    User.createVerifyAccountToken = function createVerifyAccountToken(email, expTime) {
        // This expects and email, and an expiration time window for storing a
        // messaging protocol `messagingProtocol` token, auth expiration, and
        // provider for a user. Users will be asked to validate this token against
        // the submission of `verifyMessagingProtcolToken` (With or without
        // credentials)

        // QUESTION: Do we want to add some form of rate limiting in this flow?
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
            // JRB removed protocol, because we can confirm this. Put back it leads to errors.
            // JRB: This is new
            return user.generateVerifyAccountToken(email, expTime);
        });
    };

    User.getVerifyingUser = function getVerifyingUser(token) {
        // This expects a `contactMethodVerificationToken`, and provides a user's username.
        return this.findOne({
            where: {
                contactMethodVerificationToken: token,
            },
        })
        .then((user) => {
            if (!user) {
                const err = new Error('Token not found');
                return sequelize.Promise.reject(err);
            }
            return user.username;
        });
    };

    User.verifyUserAccount = function verifyUserAccount(token) {
        return this.find({
            where: {
                contactMethodVerificationToken: token,
            },
        })
        .then((user) => {
            if (!user) {
                const err = new Error('Token not found');
                return sequelize.Promise.reject(err);
            }
            return user.addVerifiedContact(user.contactMethodToVerify);
        });
    };

    User.secureVerifyUserAccount = function secureVerifyUserAccount(token, password) {
        return this.find({
            where: {
                contactMethodVerificationToken: token,
            },
        })
        .then((user) => {
            if (!user) {
                const err = new Error('Token not found');
                return sequelize.Promise.reject(err);
            }
            const verificationPassword = crypto.pbkdf2Sync(password, Buffer.from(user.salt), 100000, 128, 'sha256').toString('hex');
            if (user.password === verificationPassword) {
                return user.addVerifiedContact(user.contactMethodToVerify);
            }
            const err = new Error('Password does not match.');
            return sequelize.Promise.reject(err);
        });
    };

    // Instance methods
    User.prototype.isAdmin = function isAdmin() {
        return this.scopes.includes('admin');
    };

    User.prototype.isVerified = function isVerified() {
        return this.verifiedContactMethods.includes(this.email);
    };

    User.prototype.getBasicUserInfo = function getBasicUserInfo() {
        return {
            id: this.id,
            uuid: this.uuid,
            username: this.username,
            email: this.email,
            scopes: this.scopes,
        };
    };

    User.prototype.updatePassword = function updatePassword() {
        this.salt = uuid.v4();
        this.password = crypto.pbkdf2Sync(this.password, Buffer.from(this.salt), 100000, 128, 'sha256').toString('hex');
        return;
    };

    User.prototype.testPassword = function testPassword(password) {
        return crypto.pbkdf2Sync(password, Buffer.from(this.salt), 100000, 128, 'sha256').toString('hex') === this.password;
    };

    User.prototype.updateResetPasswordToken = function updateResetPasswordToken(expTime) {
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
    };

    User.prototype.generateVerifyAccountToken = function generateVerifyAccountToken(email, expTime) {
        return randomBytes(20)
            .then((buf) => {
                const token = buf.toString('hex');
                return token;
            }).then((token) => {
                this.contactMethodVerificationToken = token;
                this.contactMethodToVerify = email;
                const m = moment.utc();
                m.add(expTime, 'seconds');
                this.contactMethodVerificationTokenExpires = m.format();
                return this.save().then(() => token);
            });
    };

    User.prototype.addVerifiedContact = function addVerifiedContact(contactMethodToVerify) {
        if (this.verifiedContactMethods.includes(contactMethodToVerify)) {
            // Handle instances where the user contact already exsits in the list of verified
            // contact methods
            this.contactMethodVerificationToken = null;
            this.contactMethodVerificationTokenExpires = null;
            this.contactMethodToVerify = null;
            return this.save();
        }
        const authorizedUsers = this.verifiedContactMethods;
        const authorizedUsersLength = authorizedUsers.push(contactMethodToVerify.toString());
        if (authorizedUsersLength > 0) {
            this.verifiedContactMethods = authorizedUsers;
            this.contactMethodVerificationToken = null;
            this.contactMethodVerificationTokenExpires = null;
            this.contactMethodToVerify = null;
        }
        return this.save();
    };

    return User;
};
