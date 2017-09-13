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
const baseURL = (version > 0 ? `/api/v${version}` : '/api');


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

    describe('POST /api/user:', () => {
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

        xit('should return only necessary User information', (done) => {
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

    describe(('PUT /api/user/scopes/:userId'), () => {
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
                .send({
                    scopes: ['newScope'],
                })
                .expect(httpStatus.OK)
                .then(() => request(app)
                        .get(`${baseURL}/user/${userId}`)
                        .then((userRes) => {
                            expect(userRes.body.scopes).to.deep.equal(['newScope']);
                            return;
                        }))
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
});
