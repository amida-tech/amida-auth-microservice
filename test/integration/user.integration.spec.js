/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */

/** TODO: negative tests
 * - non-admins should not be able to create users
 * - confirm that return objects do not have sensitive information
 */

import request from 'supertest';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../src/index';
import { User } from '../../src/config/sequelize';
import * as common from './common.spec';

chai.config.includeStack = true;

describe('User API:', () => {
    const testUser = {
        username: 'KK123',
        email: 'test@amida.com',
        password: 'Testpass123',
    };

    const testUserCredentials = {
        username: 'KK123',
        password: 'Testpass123',
    };

    const testCreateUser = {
        username: 'Terrance',
        email: 'terrancodactylus@amida.com',
        password: 'Testpass123',
    };

    const registrarUser = {
        username: 'Reggie',
        email: 'reg@amida.com',
        password: 'Testpass123',
        scopes: ['registrar'],
    };

    const registrarUserCredentials = {
        username: 'Reggie',
        password: 'Testpass123',
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
        password: 'Testpass123',
    };

    const userDuplicateEmail = {
        username: 'KK1234',
        email: 'test@amida.com',
        password: 'Testpass123',
    };

    const adminUser = {
        username: 'admin',
        email: 'admin@amida.com',
        password: 'Adminpass123',
        scopes: ['admin'],
    };

    const adminUserCredentials = {
        username: 'admin',
        password: 'Adminpass123',
    };

    let adminToken;
    beforeEach(() => common.seedAdminAndLogin(app)
        .then((token) => {
            adminToken = token;
            return;
        })
    );

    afterEach(() => User.destroy({ where: {} }));

    describe('GET /api/user', () => {
        let jwtToken;
        let nonAdminToken;

        before(() => common.seedAdminAndLogin(app)
            .then((token) => {
                adminToken = token;
                return;
            })
        );

        before(() => request(app)
            .post(`${common.baseURL}/user`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(adminUser)
            .expect(httpStatus.OK)
        );

        before(() => request(app)
            .post(`${common.baseURL}/user`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(testUser)
            .expect(httpStatus.OK)
        );

        before(() => common.login(app, adminUserCredentials)
            .then((token) => {
                jwtToken = token;
                return;
            })
        );

        before(() => common.login(app, testUserCredentials)
            .then((token) => {
                nonAdminToken = token;
                return;
            })
        );

        it('should get basic user info on all users', () =>
            request(app)
                .get(`${common.baseURL}/user`)
                .set('Authorization', jwtToken)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body).to.be.an.array;
                    expect(res.body).to.have.lengthOf(3);
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
                .get(`${common.baseURL}/user`)
                .set('Authorization', nonAdminToken)
                .expect(httpStatus.UNAUTHORIZED)
            );
    });

    describe('GET /api/user/byEmail/:userEmail', () => {
        let userId;
        let jwtToken;

        beforeEach(() => common.createUser(app, testUser, adminToken)
            .then((id) => {
                userId = id;
                return;
            })
        );

        beforeEach(() => common.login(app, testUserCredentials)
            .then((token) => {
                jwtToken = token;
                return;
            })
        );

        it('should get basic user info on the logged-in user', () =>
            request(app)
                .get(`${common.baseURL}/user/byEmail/${testUser.email}`)
                .set('Authorization', jwtToken)
                .expect(httpStatus.OK)
                .then((res) => {
                    const userInfo = res.body;
                    expect(userInfo.id).to.equal(userId);
                    expect(userInfo.username).to.equal(testUser.username);
                    expect(userInfo.email).to.equal(testUser.email);
                    expect(userInfo.scopes).to.deep.equal(['']);
                    expect(userInfo.password).to.not.exist;
                    expect(userInfo.salt).to.not.exist;
                    return;
                })
        );

        it('should return a 404 if the specified userEmail does not exist', () =>
            request(app)
                .get(`${common.baseURL}/user/byEmail/fake@email.com`)
                .set('Authorization', jwtToken)
                .expect(httpStatus.NOT_FOUND)
        );
    });

    describe('GET /api/user/me', () => {
        let userId;
        let jwtToken;

        beforeEach(() => common.createUser(app, testUser, adminToken)
            .then((id) => {
                userId = id;
                return;
            })
        );

        beforeEach(() => common.login(app, testUserCredentials)
            .then((token) => {
                jwtToken = token;
                return;
            })
        );

        it('should get basic user info on the logged-in user', () =>
            request(app)
                .get(`${common.baseURL}/user/me`)
                .set('Authorization', jwtToken)
                .expect(httpStatus.OK)
                .then((res) => {
                    const userInfo = res.body;
                    expect(userInfo.id).to.equal(userId);
                    expect(userInfo.username).to.equal(testUser.username);
                    expect(userInfo.email).to.equal(testUser.email);
                    expect(userInfo.scopes).to.deep.equal(['']);
                    expect(userInfo.password).to.not.exist;
                    expect(userInfo.salt).to.not.exist;
                    return;
                })
        );
    });

    describe('POST /api/user', () => {
        let nonAdminAuth;
        let registrarAuth;

        beforeEach(() => common.createUser(app, testUser, adminToken));
        beforeEach(() => common.login(app, testUserCredentials)
            .then((token) => {
                nonAdminAuth = token;
                return;
            })
        );

        beforeEach(() => common.createUser(app, registrarUser, adminToken));
        beforeEach(() => common.login(app, registrarUserCredentials)
            .then((token) => {
                registrarAuth = token;
                return;
            })
        );

        it('should reject a bad password and return error info', () => request(app)
            .post(`${common.baseURL}/user`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'KK123',
                email: 'test@amida.com',
                password: 'badpassword',
            })
            .expect(httpStatus.BAD_REQUEST)
            .then((res) => {
                expect(res.text).to.contain('must contain at least one uppercase letter');
                expect(res.text).to.contain('must contain at least one number');
                expect(res.text).to.contain('must contain at least one special character');
                return;
            })
        );

        it('should create a new user and return it without password info', (done) => {
            request(app)
                .post(`${common.baseURL}/user`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(testCreateUser)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.id).to.exist;
                    expect(res.body.username).to.equal(testCreateUser.username);
                    expect(res.body.email).to.equal(testCreateUser.email);
                    done();
                })
                .catch(done);
        });

        it('should succeed with registrarUser token (AUTH_SERVICE_REGISTRAR_SCOPES=["registrar"]', (done) => {
            request(app)
                .post(`${common.baseURL}/user`)
                .set('Authorization', registrarAuth)
                .send(testCreateUser)
                .expect(httpStatus.OK)
                .then(() => {
                    done();
                })
                .catch(done);
        });

        it('should return 401 if no token (AUTH_SERVICE_PUBLIC_REGISTRATION=false)', (done) => {
            request(app)
                .post(`${common.baseURL}/user`)
                .send(testCreateUser)
                .expect(httpStatus.UNAUTHORIZED)
                .then(() => {
                    done();
                })
                .catch(done);
        });

        it('should return 403 if nonAdmin token (AUTH_SERVICE_PUBLIC_REGISTRATION=false)', (done) => {
            request(app)
                .post(`${common.baseURL}/user`)
                .set('Authorization', nonAdminAuth)
                .send(testCreateUser)
                .expect(httpStatus.FORBIDDEN)
                .then(() => {
                    done();
                })
                .catch(done);
        });

        it('should return 400 if password is invalid', (done) => {
            request(app)
                .post(`${common.baseURL}/user`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userBadPassword)
                .expect(httpStatus.BAD_REQUEST)
                .then((res) => {
                    expect(res.text).to.contain('must be at least 8 characters long');
                    done();
                })
                .catch(done);
        });

        it('should return 400 if email is invalid', (done) => {
            request(app)
                .post(`${common.baseURL}/user`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userBadEmail)
                .expect(httpStatus.BAD_REQUEST)
                .then((res) => {
                    expect(res.text).to.contain('must be a valid email');
                    done();
                })
                .catch(done);
        });

        it('should return 409 if username is a duplicate', (done) => {
            request(app)
                .post(`${common.baseURL}/user`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userDuplicateUsername)
                .expect(httpStatus.CONFLICT)
                .then((res) => {
                    expect(res.text).to.contain('username must be unique');
                    done();
                })
                .catch(done);
        });

        it('should return 409 if email is a duplicate', (done) => {
            request(app)
                .post(`${common.baseURL}/user`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userDuplicateEmail)
                .expect(httpStatus.CONFLICT)
                .then((res) => {
                    expect(res.text).to.contain('email must be unique');
                    done();
                })
                .catch(done);
        });

        it('should return only necessary User information', (done) => {
            request(app)
                .post(`${common.baseURL}/user`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(testCreateUser)
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

        beforeEach(() => common.createUser(app, adminUser, adminToken)
            .then((id) => {
                adminUserId = id;
                return;
            })
        );

        beforeEach(() => common.createUser(app, testUser, adminToken)
            .then((id) => {
                userId = id;
                return;
            })
        );

        beforeEach(() => common.login(app, testUserCredentials)
            .then((token) => {
                jwtToken = token;
                return;
            })
        );

        beforeEach(() => common.login(app, adminUserCredentials)
            .then((token) => {
                adminJwtToken = token;
                return;
            })
        );

        it('should return a 404 if the specified userId does not exist', () =>
            request(app)
                .put(`${common.baseURL}/user/999999`)
                .set('Authorization', adminJwtToken)
                .send({ email: 'newemail' })
                .expect(httpStatus.NOT_FOUND)
        );

        it('should update a user\'s email', () => common.testEmailUpdate(app, jwtToken, userId));

        it('should allow admins to update another user\'s email', () => common.testEmailUpdate(app, adminJwtToken, userId));

        it('should forbid users from updating another user\'s email', () => {
            request(app)
                .put(`${common.baseURL}/user/${adminUserId}`)
                .set('Authorization', jwtToken)
                .send({ email: 'newemail' })
                .expect(httpStatus.FORBIDDEN);
        });
    });

    describe('PUT /api/user/scopes/:userId', () => {
        let userId;
        let jwtToken;

        beforeEach(() => common.createUser(app, adminUser, adminToken));

        beforeEach(() => common.createUser(app, testUser, adminToken)
            .then((id) => {
                userId = id;
                return;
            })
        );

        beforeEach(() => common.login(app, adminUserCredentials)
            .then((token) => {
                jwtToken = token;
                return;
            })
        );

        it('should require admin permissions to use this route', () =>
            request(app)
                .post(`${common.baseURL}/auth/login`)
                .send(testUserCredentials)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body).to.have.property('token');
                    jwtToken = `Bearer ${res.body.token}`;
                    return request(app)
                        .put(`${common.baseURL}/user/scopes/${userId}`)
                        .set('Authorization', jwtToken)
                        .send({
                            scopes: ['newScope'],
                        })
                        .expect(httpStatus.FORBIDDEN);
                })
        );

        it('should reject updates to scopes not using an array', () =>
            request(app)
                .put(`${common.baseURL}/user/scopes/${userId}`)
                .set('Authorization', jwtToken)
                .send({
                    scopes: 'badscope',
                })
                .expect(httpStatus.BAD_REQUEST)
        );

        it('should reject updates with duplicate values', () =>
            request(app)
                .put(`${common.baseURL}/user/scopes/${userId}`)
                .set('Authorization', jwtToken)
                .send({
                    scopes: ['notUnique', 'notUnique'],
                })
                .expect(httpStatus.BAD_REQUEST)
        );

        it('should overwrite the old array', () =>
            request(app)
                .put(`${common.baseURL}/user/scopes/${userId}`)
                .set('Authorization', jwtToken)
                .send({ scopes: ['newScope'] })
                .expect(httpStatus.OK)
                .then(() => request(app)
                    .get(`${common.baseURL}/user/${userId}`)
                    .set('Authorization', jwtToken)
                    .then((userRes) => {
                        expect(userRes.body.scopes).to.deep.equal(['newScope']);
                        return;
                    }))
        );

        it('should return the new information of the changed user', () =>
            request(app)
                .put(`${common.baseURL}/user/scopes/${userId}`)
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
                .put(`${common.baseURL}/user/scopes/${userId}`)
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

        beforeEach(() => common.createUser(app, adminUser, adminToken)
            .then((id) => {
                adminUserId = id;
                return;
            })
        );

        beforeEach(() => common.createUser(app, testUser, adminToken)
            .then((id) => {
                userId = id;
                return;
            })
        );

        beforeEach(() => common.login(app, testUserCredentials)
            .then((token) => {
                jwtToken = token;
                return;
            })
        );

        beforeEach(() => common.login(app, adminUserCredentials)
            .then((token) => {
                adminJwtToken = token;
                return;
            })
        );

        it('should allow admins to delete users', () =>
            request(app)
                .delete(`${common.baseURL}/user/${userId}`)
                .set('Authorization', adminJwtToken)
                .expect(httpStatus.NO_CONTENT)
                .then(() => User.findById(userId))
                .then(res => expect(res).to.be.null)
        );

        it('should not allow non-admins to delete users', () =>
            request(app)
                .delete(`${common.baseURL}/user/${adminUserId}`)
                .set('Authorization', jwtToken)
                .expect(httpStatus.FORBIDDEN)
        );

        it('using the JWT for a deleted user should fail', () =>
            request(app)
                .delete(`${common.baseURL}/user/${userId}`)
                .set('Authorization', adminJwtToken)
                .expect(httpStatus.NO_CONTENT)
                .then(() => request(app)
                    .get(`${common.baseURL}/user/me`)
                    .set('Authorization', jwtToken)
                    .expect(httpStatus.UNAUTHORIZED)
                )
        );
    });
});
