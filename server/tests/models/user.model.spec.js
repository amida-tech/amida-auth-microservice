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

describe('User models:', () => {
    before(() => sequelize.sync({
        force: true,
    }));

    after(() => User.drop({
        force: true,
    }));

    afterEach(() => User.destroy({ where: {} }));

    describe('create', () => {
        it('should create a new object with all properties', (done) => {
            User.create(testUser)
                .then((user) => {
                    expect(user.id).to.exist;
                    expect(user.username).to.equal(testUser.username);
                    expect(user.email).to.equal(testUser.email);
                    expect(user.password).to.have.lengthOf(256);
                    expect(user.salt).to.have.lengthOf(36);
                    done();
                })
                .catch(done);
        });
    });

    describe('remove', () => {
        it('should remove the specified object', (done) => {
            User.create(testUser)
                .then((user) => {
                    User.destroy({ where: {
                        id: user.id,
                    } })
                    .then(() => {
                        User.findAll()
                            .then((users) => {
                                expect(users).to.have.lengthOf(0);
                                done();
                            })
                            .catch(done);
                    })
                    .catch(done);
                })
                .catch(done);
        });
    });

    describe('update', () => {
        it('should allow email update');

        it('should update passwords via salt and hash');
    });

    describe('beforeValidate', () => {
        it('should automatically update the hashed password on password change', (done) => {
            User.create(testUser)
                .then((user) => {
                    const firstPass = user.password;
                    user.password = '12345678';
                    user.save()
                        .then(user.reload)
                        .then(() => {
                            expect(user.password).to.not.equal(firstPass);
                            done();
                        })
                        .catch(done);
                })
                .catch(done);
        });

        it('should not update the password if it was not changed', (done) => {
            User.create(testUser)
                .then((user) => {
                    const firstPass = user.password;
                    user.save()
                        .then(user.reload)
                        .then(() => {
                            expect(user.password).to.equal(firstPass);
                            done();
                        })
                        .catch(done);
                })
                .catch(done);
        });
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
});
