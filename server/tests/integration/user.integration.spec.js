/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */

import request from 'supertest';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../../index';
import p from '../../../package';
import {
    User,
    sequelize,
} from '../../../config/sequelize';

chai.config.includeStack = true;

const version = p.version.split('.').shift();
const baseURL = `/api/v${version}`;


describe('User API:', () => {
    before(() => sequelize.sync({
        force: true,
    }));

    after(() => User.destroy({ where: {} }));

    const user = {
        username: 'KK123',
        email: 'test@amida.com',
        password: 'testpass',
    };

    const userCredentials = {
        username: 'KK123',
        password: 'testpass',
    };

    const userBadPassword = {
        username: 'KK123',
        email: 'test@amida.com',
        password: 'badpass',
    };

    const userBadEmail = {
        username: 'KK123',
        email: 'testamida.com',
        password: 'goodpass',
    };

    const userDuplicateUsername = {
        username: 'KK123',
        email: 'test2@amida.com',
        password: 'testpass',
    };

    const userDuplicateEmail = {
        username: 'KK1234',
        email: 'test@amida.com',
        password: 'testpass',
    };

    const adminUser = {
        username: 'admin',
        email: 'admin@amida.com',
        password: 'adminpass',
        scopes: ['admin'],
    };

    const adminUserCredentials = {
        username: 'admin',
        password: 'adminpass',
    };

    beforeEach(() => User.destroy({ where: {} }));

    describe('GET /api/user', () => {
        let jwtToken;
        let nonAdminToken;

        beforeEach(() => request(app)
            .post(`${baseURL}/user`)
            .send(adminUser)
            .expect(httpStatus.OK)
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/user`)
            .send(user)
            .expect(httpStatus.OK)
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(adminUserCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                jwtToken = `Bearer ${res.body.token}`;
                return;
            })
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(userCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                nonAdminToken = `Bearer ${res.body.token}`;
                return;
            })
        );

        it('should get basic user info on all users', () =>
            request(app)
                .get(`${baseURL}/user`)
                .set('Authorization', jwtToken)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body).to.be.an.array;
                    expect(res.body).to.have.lengthOf(2);
                    res.body.forEach((elem) => {
                        expect(elem.id).to.exist;
                        expect(elem.username).to.exist;
                        expect(elem.email).to.exist;
                    });
                    return;
                })
        );

        it('non-admins cannot get basic user info on all users', () =>
            request(app)
                .get(`${baseURL}/user`)
                .set('Authorization', nonAdminToken)
                .expect(httpStatus.FORBIDDEN)
            );
    });

    describe('GET /api/user/me', () => {
        let userId;
        let jwtToken;

        beforeEach(() => request(app)
            .post(`${baseURL}/user`)
            .send(user)
            .expect(httpStatus.OK)
            .then((res) => {
                userId = res.body.id;
                return;
            })
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(userCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                jwtToken = `Bearer ${res.body.token}`;
                return;
            })
        );

        it('should get basic user info on the logged-in user', () =>
            request(app)
                .get(`${baseURL}/user/me`)
                .set('Authorization', jwtToken)
                .expect(httpStatus.OK)
                .then((res) => {
                    const userInfo = res.body;
                    expect(userInfo.id).to.equal(userId);
                    expect(userInfo.username).to.equal(user.username);
                    expect(userInfo.email).to.equal(user.email);
                    expect(userInfo.scopes).to.deep.equal(['']);
                    expect(userInfo.password).to.not.exist;
                    expect(userInfo.salt).to.not.exist;
                    return;
                })
        );
    });

    describe('POST /api/user', () => {
        it('should create a new user and return it without password info', (done) => {
            request(app)
                .post(`${baseURL}/user`)
                .send(user)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.id).to.exist;
                    expect(res.body.username).to.equal(user.username);
                    expect(res.body.email).to.equal(user.email);
                    done();
                })
                .catch(done);
        });

        it('should return 400 if password is invalid', (done) => {
            request(app)
                .post(`${baseURL}/user`)
                .send(userBadPassword)
                .expect(httpStatus.BAD_REQUEST)
                .then((res) => {
                    expect(res.text).to.contain('length must be at least 8 characters long');
                    done();
                })
                .catch(done);
        });

        it('should return 400 if email is invalid', (done) => {
            request(app)
                .post(`${baseURL}/user`)
                .send(userBadEmail)
                .expect(httpStatus.BAD_REQUEST)
                .then((res) => {
                    expect(res.text).to.contain('must be a valid email');
                    done();
                })
                .catch(done);
        });

        it('should return 400 if username is a duplicate', (done) => {
            request(app)
                .post(`${baseURL}/user`)
                .send(user)
                .expect(httpStatus.OK)
                .then(() => {
                    request(app)
                        .post(`${baseURL}/user`)
                        .send(userDuplicateUsername)
                        .expect(httpStatus.BAD_REQUEST)
                        .then((res) => {
                            expect(res.text).to.contain('username must be unique');
                            done();
                        })
                        .catch(done);
                })
                .catch(done);
        });

        it('should return 400 if email is a duplicate', (done) => {
            request(app)
                .post(`${baseURL}/user`)
                .send(user)
                .expect(httpStatus.OK)
                .then(() => {
                    request(app)
                        .post(`${baseURL}/user`)
                        .send(userDuplicateEmail)
                        .expect(httpStatus.BAD_REQUEST)
                        .then((res) => {
                            expect(res.text).to.contain('email must be unique');
                            done();
                        })
                        .catch(done);
                })
                .catch(done);
        });

        it('should return only necessary User information', (done) => {
            request(app)
                .post(`${baseURL}/user`)
                .send(user)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.password).to.not.exist;
                    expect(res.body.salt).to.not.exist;
                    done();
                })
                .catch(done);
        });
    });

    describe('PUT /api/user/:userId', () => {
        let userId;
        let adminUserId;
        let jwtToken;
        let adminJwtToken;

        beforeEach(() => request(app)
            .post(`${baseURL}/user`)
            .send(adminUser)
            .expect(httpStatus.OK)
            .then((res) => {
                adminUserId = res.body.id;
                return;
            })
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/user`)
            .send(user)
            .expect(httpStatus.OK)
            .then((res) => {
                userId = res.body.id;
                return;
            })
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(userCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                jwtToken = `Bearer ${res.body.token}`;
                return;
            })
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(adminUserCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                adminJwtToken = `Bearer ${res.body.token}`;
                return;
            })
        );

        it('should update a user\'s email', () =>
            request(app)
                .put(`${baseURL}/user/${userId}`)
                .set('Authorization', jwtToken)
                .send({ email: 'newemail@email.com' })
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.username).to.equal('KK123');
                    expect(res.body.email).to.equal('newemail@email.com');
                    return;
                })
        );

        it('should allow admins to update another user\'s email', () =>
            request(app)
                .put(`${baseURL}/user/${userId}`)
                .set('Authorization', adminJwtToken)
                .send({ email: 'newemail@email.com' })
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.username).to.equal('KK123');
                    expect(res.body.email).to.equal('newemail@email.com');
                    return;
                })
        );

        it('should forbid users from updating another user\'s email', () => {
            request(app)
                .put(`${baseURL}/user/${adminUserId}`)
                .set('Authorization', jwtToken)
                .send({ email: 'newemail' })
                .expect(httpStatus.FORBIDDEN);
        });
    });

    describe('PUT /api/user/scopes/:userId', () => {
        let userId;
        let jwtToken;

        beforeEach(() => request(app)
            .post(`${baseURL}/user`)
            .send(adminUser)
            .expect(httpStatus.OK)
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/user`)
            .send(user)
            .expect(httpStatus.OK)
            .then((res) => {
                userId = res.body.id;
                return;
            })
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(adminUserCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                jwtToken = `Bearer ${res.body.token}`;
                return;
            })
        );

        it('should require admin permissions to use this route', () =>
            request(app)
                .post(`${baseURL}/auth/login`)
                .send(userCredentials)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body).to.have.property('token');
                    jwtToken = `Bearer ${res.body.token}`;
                    return request(app)
                        .put(`${baseURL}/user/scopes/${userId}`)
                        .set('Authorization', jwtToken)
                        .send({
                            scopes: ['newScope'],
                        })
                        .expect(httpStatus.FORBIDDEN);
                })
        );

        it('should reject updates to scopes not using an array', () =>
            request(app)
                .put(`${baseURL}/user/scopes/${userId}`)
                .set('Authorization', jwtToken)
                .send({
                    scopes: 'badscope',
                })
                .expect(httpStatus.BAD_REQUEST)
        );

        it('should reject updates with duplicate values', () =>
            request(app)
                .put(`${baseURL}/user/scopes/${userId}`)
                .set('Authorization', jwtToken)
                .send({
                    scopes: ['notUnique', 'notUnique'],
                })
                .expect(httpStatus.BAD_REQUEST)
        );

        it('should overwrite the old array', () =>
            request(app)
                .put(`${baseURL}/user/scopes/${userId}`)
                .set('Authorization', jwtToken)
                .send({ scopes: ['newScope'] })
                .expect(httpStatus.OK)
                .then(() => request(app)
                    .get(`${baseURL}/user/${userId}`)
                    .set('Authorization', jwtToken)
                    .then((userRes) => {
                        expect(userRes.body.scopes).to.deep.equal(['newScope']);
                        return;
                    }))
        );

        it('should return the new information of the changed user', () =>
            request(app)
                .put(`${baseURL}/user/scopes/${userId}`)
                .set('Authorization', jwtToken)
                .send({ scopes: ['newScope'] })
                .expect(httpStatus.OK)
                .then((userRes) => {
                    expect(userRes.body.scopes).to.deep.equal(['newScope']);
                    return;
                })
        );

        it('should work with an empty array update', () =>
            request(app)
                .put(`${baseURL}/user/scopes/${userId}`)
                .set('Authorization', jwtToken)
                .send({
                    scopes: [''],
                })
                .expect(httpStatus.OK)
                .then((userRes) => {
                    expect(userRes.body.scopes).to.deep.equal(['']);
                    return;
                })
        );
    });

    describe('DELETE /api/user/:userId', () => {
        let userId;
        let adminUserId;
        let jwtToken;
        let adminJwtToken;

        beforeEach(() => request(app)
            .post(`${baseURL}/user`)
            .send(adminUser)
            .expect(httpStatus.OK)
            .then((res) => {
                adminUserId = res.body.id;
                return;
            })
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/user`)
            .send(user)
            .expect(httpStatus.OK)
            .then((res) => {
                userId = res.body.id;
                return;
            })
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(userCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                jwtToken = `Bearer ${res.body.token}`;
                return;
            })
        );

        beforeEach(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(adminUserCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                adminJwtToken = `Bearer ${res.body.token}`;
                return;
            })
        );

        it('should allow admins to delete users', () =>
            request(app)
                .delete(`${baseURL}/user/${userId}`)
                .set('Authorization', adminJwtToken)
                .expect(httpStatus.NO_CONTENT)
                .then(() => User.findById(userId))
                .then(res => expect(res).to.be.null)
        );

        it('should not allow non-admins to delete users', () =>
            request(app)
                .delete(`${baseURL}/user/${adminUserId}`)
                .set('Authorization', jwtToken)
                .expect(httpStatus.FORBIDDEN)
        );

        it('using the JWT for a deleted user should fail', () =>
            request(app)
                .delete(`${baseURL}/user/${userId}`)
                .set('Authorization', adminJwtToken)
                .expect(httpStatus.NO_CONTENT)
                .then(() => request(app)
                    .get(`${baseURL}/user/me`)
                    .set('Authorization', jwtToken)
                    .expect(httpStatus.UNAUTHORIZED)
                )
        );
    });
});
