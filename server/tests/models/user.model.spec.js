/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */
/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint new-cap: 0 */

import chai, { expect } from 'chai';
import {
    User,
    sequelize,
} from '../../../config/sequelize';

chai.config.includeStack = true;

const testUser = {
    username: 'KK123',
    email: 'test@amida.com',
    password: 'testpass',
};

const expTime = 3600;

describe('User models:', () => {
    before(() => User.sync({
        force: true,
    }));

    after(() => User.destroy({ where: {} }));

    afterEach(() => User.destroy({ where: {} }));

    describe('create', () => {
        it('should create a new object with all properties', () => User.create(testUser)
                .then((user) => {
                    expect(user.id).to.exist;
                    expect(user.username).to.equal(testUser.username);
                    expect(user.email).to.equal(testUser.email);
                    expect(user.password).to.have.lengthOf(256);
                    expect(user.salt).to.have.lengthOf(36);
                }));
    });

    describe('remove', () => {
        it('should remove the specified object', () => User.create(testUser)
            .then(user => User.destroy({ where: { id: user.id } }))
            .then(() => User.findAll())
            .then((users) => {
                expect(users).to.have.lengthOf(0);
            }));
    });

    describe('update', () => {
        it('should allow email update');

        it('should update passwords via salt and hash');
    });

    describe('beforeUpdate', () => {
        it('should automatically update the hashed password on password change', () =>
            User.create(testUser)
                .then((user) => {
                    const firstPass = user.password;
                    user.password = '12345678';
                    return user.save()
                        .then(() => user.reload)
                        .then(() => expect(user.password).to.not.equal(firstPass));
                })
        );

        it('should not update the password if it was not changed', () =>
            User.create(testUser)
                .then((user) => {
                    const firstPass = user.password;
                    return user.save()
                        .then(() => user.reload)
                        .then(() => expect(user.password).to.equal(firstPass));
                })
        );
    });

    describe('setPassword', () => {
        it('should return a new salted and hashed password');
    });

    describe('testPassword', () => {
        it('should return true if supplied password matches the stored password', (done) => {
            User.create(testUser)
                .then((user) => {
                    expect(user.testPassword(testUser.password)).to.be.true;
                    done();
                })
                .catch(done);
        });

        it('should return false if supplied password does not match the stored password', (done) => {
            User.create(testUser)
                .then((user) => {
                    expect(user.testPassword('fakepass')).to.be.false;
                    done();
                })
                .catch(done);
        });
    });

    describe('Password reset:', () => {
        describe('resetPasswordToken', () => {
            it('should error if the supplied email does not match a user', (done) => {
                User.create(testUser)
                    .then(() => {
                        User.resetPasswordToken('bad@email.com', expTime)
                            .catch((err) => {
                                expect(err).to.be.an.error;
                                expect(err.message).to.contain('Email not found');
                                done();
                            });
                    })
                    .catch(done);
            });

            it('should return a token if successful', (done) => {
                User.create(testUser)
                    .then(() => User.resetPasswordToken(testUser.email, expTime))
                    .then((token) => {
                        expect(token).to.exist;
                        expect(token).to.have.lengthOf(40);
                        done();
                    })
                    .catch(done);
            });

            it('should set the password reset token and expiration time if successful', (done) => {
                User.create(testUser)
                    .then((user) => {
                        User.resetPasswordToken(testUser.email, expTime)
                            .then((token) => {
                                user.reload()
                                    .then(() => {
                                        expect(user.resetToken).to.equal(token);
                                        expect(user.resetExpires).to.be.a.date;
                                        done();
                                    });
                            });
                    })
                    .catch(done);
            });
        });

        describe('resetPassword', () => {
            it('should error if the supplied token is not found', (done) => {
                User.create(testUser)
                    .then(() => User.resetPasswordToken(testUser.email, expTime))
                    .then(() => User.resetPassword('badtoken', 'newerpass'))
                    .catch((err) => {
                        expect(err).to.be.an.error;
                        expect(err.message).to.contain('reset token is invalid');
                        done();
                    })
                    .catch(done);
            });

            it('should error if the current time is after the expiration time', (done) => {
                User.create(testUser)
                    .then(() => User.resetPasswordToken(testUser.email, 0))
                    .then(token => User.resetPassword(token, 'newerpass'))
                    .catch((err) => {
                        expect(err).to.be.an.error;
                        expect(err.message).to.contain('reset token is invalid');
                        done();
                    })
                    .catch(done);
            });

            it('should update the password if the supplied token is valid', (done) => {
                User.create(testUser)
                    .then(() => User.resetPasswordToken(testUser.email, expTime))
                    .then(token => User.resetPassword(token, 'newerpass'))
                    .then(() => {
                        User.find({
                            where: {
                                username: testUser.username,
                            },
                        }).then((user) => {
                            expect(user.testPassword('newerpass')).to.be.true;
                            done();
                        }).catch(done);
                    })
                    .catch(done);
            }).timeout(4000);
        });

        describe('updateResetPasswordToken', () => {
            it('should set a random token and the supplied expiration time', (done) => {
                User.create(testUser)
                    .then((user) => {
                        user.updateResetPasswordToken(expTime)
                            .then((token) => {
                                user.reload()
                                    .then(() => {
                                        expect(user.resetToken).to.equal(token);
                                        expect(user.resetExpires).to.be.a.date;
                                        done();
                                    });
                            });
                    })
                    .catch(done);
            });

            it('should return the reset token', (done) => {
                User.create(testUser)
                    .then(user => user.updateResetPasswordToken(expTime))
                    .then((token) => {
                        expect(token).to.exist;
                        done();
                    })
                    .catch(done);
            });
        });
    });
});
