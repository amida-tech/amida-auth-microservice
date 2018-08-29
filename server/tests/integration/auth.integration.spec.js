/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */

import request from 'supertest';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../../index';
import { User } from '../../../config/sequelize';
import * as common from './common.spec';
import config from '../../../config/config';

chai.config.includeStack = true;

describe('Auth API:', () => {
    let jwtToken;
    before(() => User.destroy({ where: {}, logging: false }).catch(() => 1));
    // run health check to ensure sync runs
    before((done) => {
        request(app)
            .get('/api/health-check')
            .expect(httpStatus.OK)
            .then(setTimeout(done, 1000));
    });

    describe('Seed', () => {
        it('should seed with the config admin', () =>
            request(app)
                .get('/api/health-check')
                .then(User.count().then((total) => {
                    expect(total).to.equal(1);
                }))
                .then(User.find({ where: { email: config.adminUser.email } }).then(user =>
                    expect(user.username).to.equal(config.adminUser.username)
                ))
        );
    });

    describe('POST /auth/login', () => {
        before(() => common
            .seedAdminAndLogin(app)
            .then(token => common.setupTestUser(app, token))
        );

        after(() => User.destroy({ where: {} }));

        it('should return 401 error with bad password', () =>
            request(app).post(`${common.baseURL}/auth/login`)
                .send(common.badPassword)
                .expect(httpStatus.NOT_FOUND)
                .then((res) => {
                    expect(res.body.message).to.equal('Incorrect username or password');
                    expect(res.body.code).to.equal('INCORRECT_USERNAME_OR_PASSWORD');
                    expect(res.body.status).to.equal('ERROR');
                })
        );

        it('should return 404 when there is no username found', () =>
            request(app).post(`${common.baseURL}/auth/login`)
                .send(common.missingUsername)
                .expect(httpStatus.NOT_FOUND)
                .then((res) => {
                    expect(res.body.message).to.equal('Incorrect username or password');
                    expect(res.body.code).to.equal('INCORRECT_USERNAME_OR_PASSWORD');
                    expect(res.body.status).to.equal('ERROR');
                })
        );

        it('should get valid JWT token', () =>
            request(app).post(`${common.baseURL}/auth/login`)
                .send(common.validUserCredentials)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body).to.have.property('token');
                    const decoded = common.decodeToken(res.body.token);
                    expect(decoded.username).to.equal(common.validUserCredentials.username);
                    expect(decoded.email).to.equal(common.testUser.email);
                    expect(decoded.scopes).to.deep.equal(common.testUser.scopes);
                    return;
                })
        );
    });

    describe('GET /auth/facebook', () => {
        if (config.facebook.clientId) {
            it('should redirect to the facebook OAuth page', () =>
                request(app)
                    .get(`${common.baseURL}/auth/facebook`)
                    .expect(httpStatus.FOUND)
                    .then((res) => {
                        expect(res.get('Location')).to.have.string('https://www.facebook.com/dialog/oauth');
                    })
            );
        }
    });

    describe('POST /auth/token', () => {
        let refreshToken;

        before(() => common
            .seedAdminAndLogin(app)
            .then(token => common.setupTestUser(app, token))
        );

        after(() => User.destroy({ where: {} }));

        before(() => request(app)
            .post(`${common.baseURL}/auth/login`)
            .send(common.validUserCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('refreshToken');
                refreshToken = res.body.refreshToken;
                return;
            })
        );

        it('should get a new auth token using a valid refresh token', () => request(app)
            .post(`${common.baseURL}/auth/token`)
            .send({
                username: 'KK123',
                refreshToken,
            })
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                const decoded = common.decodeToken(res.body.token);
                expect(decoded.username).to.equal(common.validUserCredentials.username);
                expect(decoded.email).to.equal(common.testUser.email);
                expect(decoded.scopes).to.deep.equal(common.testUser.scopes);
                return;
            })
        );

        it('should reject an invalid refresh token', () => request(app)
            .post(`${common.baseURL}/auth/token`)
            .send({
                username: 'KK123',
                refreshToken: 'BadRefreshToken',
            })
            .expect(httpStatus.NOT_FOUND)
        );

        it('should be able to expire refresh tokens', () => request(app)
            .post(`${common.baseURL}/auth/token/reject`)
            .send({
                refreshToken,
            })
            .expect(httpStatus.NO_CONTENT)
            .then(() => request(app)
                .post(`${common.baseURL}/auth/token`)
                .send({
                    username: 'KK123',
                    refreshToken,
                })
                .expect(httpStatus.NOT_FOUND)
            )
        );

        it('should allow multiple refresh tokens for multiple devices', () => request(app)
            .post(`${common.baseURL}/auth/login`)
            .send(common.validUserCredentials)
            .expect(httpStatus.OK)
            .then((res1) => {
                expect(res1.body).to.have.property('refreshToken');
                const token1 = res1.body.refreshToken;
                return request(app)
                    .post(`${common.baseURL}/auth/login`)
                    .send(common.validUserCredentials)
                    .expect(httpStatus.OK)
                    .then((res2) => {
                        expect(res2.body).to.have.property('refreshToken');
                        const token2 = res2.body.refreshToken;
                        expect(token1).to.not.equal(token2);
                        return;
                    });
            })
        );
    });

    describe('POST /auth/reset-password', () => {
        let resetToken;

        before(() => common
            .seedAdminAndLogin(app)
            .then(token => common.setupTestUser(app, token))
        );

        after(() => User.destroy({ where: {} }));

        before(() => request(app)
            .post(`${common.baseURL}/auth/login`)
            .send(common.validUserCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                const decoded = common.decodeToken(res.body.token);
                expect(decoded.username).to.equal(common.validUserCredentials.username);
                jwtToken = `Bearer ${res.body.token}`;
            })
        );

        it('should require an email in the request body', () =>
            request(app)
                .post(`${common.baseURL}/auth/reset-password`)
                .expect(httpStatus.BAD_REQUEST)
                .then(res => expect(JSON.parse(res.text).message).to.equal('"email" is required'))
        );

        it('should set the password to a random string', () =>
            User.find({ where: { username: common.testUser.username } })
                .then(oldUser => request(app)
                    .post(`${common.baseURL}/auth/reset-password`)
                    .send({ email: common.testUser.email })
                    .expect(httpStatus.OK)
                    .then(() => User.find({ where: { username: common.testUser.username } }))
                    .then((user) => {
                        expect(user.password).to.have.lengthOf(256);
                        expect(user.password).to.not.equal(oldUser.password);
                        return;
                    })
                )
        );

        it('should generate a token (test env only)', () =>
            request(app)
                .post(`${common.baseURL}/auth/reset-password`)
                .send({ email: common.testUser.email })
                .expect(httpStatus.OK)
                .then(res => expect(res.body.token).to.exist)
        );

        it('should accept the reset token', () =>
            request(app)
                .post(`${common.baseURL}/auth/reset-password`)
                .send({ email: common.testUser.email })
                .expect(httpStatus.OK)
                .then((res1) => {
                    resetToken = res1.body.token;
                    return request(app).post(`${common.baseURL}/auth/reset-password/${resetToken}`)
                        .send({ password: 'Newerpass123' })
                        .expect(httpStatus.OK)
                        .then(res2 => expect(res2.text).to.equal('OK'));
                })
        );

        it('should update the password', () =>
            request(app)
                .post(`${common.baseURL}/auth/reset-password`)
                .send({ email: common.testUser.email })
                .expect(httpStatus.OK)
                .then((res1) => {
                    resetToken = res1.body.token;
                    return request(app)
                        .post(`${common.baseURL}/auth/reset-password/${resetToken}`)
                        .send({ password: 'Newerpass123' })
                        .expect(httpStatus.OK)
                        .then(() => request(app)
                                .post(`${common.baseURL}/auth/login`)
                                .send({
                                    username: 'KK123',
                                    password: 'Newerpass123',
                                })
                                .expect(httpStatus.OK));
                })
        );
    });

    describe('POST /auth/update-password', () => {
        before(() => common
            .seedAdminAndLogin(app)
            .then(token => common.setupTestUser(app, token))
        );

        after(() => User.destroy({ where: {} }));

        before(() => request(app)
            .post(`${common.baseURL}/auth/login`)
            .send(common.validUserCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                const decoded = common.decodeToken(res.body.token);
                expect(decoded.username).to.equal(common.validUserCredentials.username);
                jwtToken = `Bearer ${res.body.token}`;
                return;
            })
        );

        it('should update user password when user is authenticated', () =>
            request(app)
                .post(`${common.baseURL}/auth/update-password`)
                .set('Authorization', jwtToken)
                .send({ password: 'Newerpass123' })
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.text).to.equal('OK');
                    return request(app).post(`${common.baseURL}/auth/login`)
                        .send({
                            username: 'KK123',
                            password: 'Newerpass123',
                        })
                        .expect(httpStatus.OK);
                })
        );

        it('should return 401 when user is not authenticated', () =>
            request(app)
                .post(`${common.baseURL}/auth/update-password`)
                .send({ password: 'Newerpass123' })
                .expect(httpStatus.UNAUTHORIZED)
                .then(res => expect(res.text).to.equal('Unauthorized'))
        );

        it('should return 401 when JWT is invalid', () =>
            request(app)
                .post(`${common.baseURL}/auth/update-password`)
                .set('Authorization', 'Bearer BadJWT')
                .send({ password: 'Newerpass123' })
                .expect(httpStatus.UNAUTHORIZED)
                .then(res => expect(res.text).to.equal('Unauthorized'))
        );

        it('should return 400 if password update is invalid', () =>
            request(app)
                .post(`${common.baseURL}/auth/update-password`)
                .set('Authorization', jwtToken)
                .send({ password: 'badpass' })
                .expect(httpStatus.BAD_REQUEST)
                .then(res => expect(res.text).to.contain('must be at least 8 characters long'))
        );
    });
});
