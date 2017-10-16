/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */

import request from 'supertest';
import fs from 'fs';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import chai, { expect } from 'chai';
import app from '../../../index';
import p from '../../../package';
import {
    User,
    sequelize,
} from '../../../config/sequelize';
import config from '../../../config/config';

chai.config.includeStack = true;

const version = p.version.split('.').shift();
const baseURL = `/api/v${version}`;

const testUser = {
    username: 'KK123',
    email: 'test@amida.com',
    password: 'testpass',
    scopes: ['admin'],
};

const badPassword = {
    username: 'KK123',
    password: 'badpassword',
};

const missingUsername = {
    username: 'missing',
    password: 'testpass',
};

const validUserCredentials = {
    username: 'KK123',
    password: 'testpass',
};

describe('Auth API:', () => {
    before(() => sequelize.sync({
        force: true,
    }));

    after(() => User.destroy({ where: {} }));

    let jwtToken;

    describe('POST /auth/login', () => {
        before(() => request(app)
            .post(`${baseURL}/user`)
            .send(testUser)
            .expect(httpStatus.OK)
        );

        after(() => User.destroy({ where: {} }));

        it('should return 401 error with bad password', () =>
            request(app).post(`${baseURL}/auth/login`)
                .send(badPassword)
                .expect(httpStatus.UNAUTHORIZED)
                .then(res => expect(res.body.message).to.equal('Incorrect password'))
        );

        it('should return 404 when there is no username found', () =>
            request(app).post(`${baseURL}/auth/login`)
                .send(missingUsername)
                .expect(httpStatus.NOT_FOUND)
                .then(res => expect(res.body.message).to.equal('Username not found'))
        );

        it('should get valid JWT token', () =>
            request(app).post(`${baseURL}/auth/login`)
                .send(validUserCredentials)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body).to.have.property('token');
                    let decoded;
                    if (config.jwtMode === 'rsa') {
                        const cert = fs.readFileSync(config.jwtPublicKeyPath);
                        decoded = jwt.verify(res.body.token, cert);
                    } else {
                        decoded = jwt.verify(res.body.token, config.jwtSecret);
                    }
                    expect(decoded.username).to.equal(validUserCredentials.username);
                    expect(decoded.email).to.equal(testUser.email);
                    expect(decoded.scopes).to.deep.equal(testUser.scopes);
                    return;
                })
        );
    });

    describe('GET /auth/facebook', () => {
        it('should redirect to the facebook OAuth page', () =>
            request(app)
                .get(`${baseURL}/auth/facebook`)
                .expect(httpStatus.FOUND)
                .then((res) => {
                    expect(res.get('Location')).to.have.string('https://www.facebook.com/dialog/oauth');
                })
        );
    });

    describe('POST /auth/reset-password', () => {
        let resetToken;

        before(() => request(app)
            .post(`${baseURL}/user`)
            .send(testUser)
            .expect(httpStatus.OK)
        );

        after(() => User.destroy({ where: {} }));

        before(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(validUserCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                let decoded;
                if (config.jwtMode === 'rsa') {
                    const cert = fs.readFileSync(config.jwtPublicKeyPath);
                    decoded = jwt.verify(res.body.token, cert);
                } else {
                    decoded = jwt.verify(res.body.token, config.jwtSecret);
                }
                expect(decoded.username).to.equal(validUserCredentials.username);
                jwtToken = `Bearer ${res.body.token}`;
            })
        );

        it('should set the password to a random string', () =>
            User.find({ where: { username: testUser.username } })
                .then(oldUser => request(app)
                    .post(`${baseURL}/auth/reset-password`)
                    .send({ email: testUser.email })
                    .expect(httpStatus.OK)
                    .then(() => User.find({ where: { username: testUser.username } }))
                    .then((user) => {
                        expect(user.password).to.have.lengthOf(256);
                        expect(user.password).to.not.equal(oldUser.password);
                        return;
                    })
                )
        );

        it('should generate a token (test env only)', () =>
            request(app)
                .post(`${baseURL}/auth/reset-password`)
                .send({ email: testUser.email })
                .expect(httpStatus.OK)
                .then(res => expect(res.body.token).to.exist)
        );

        it('should accept the reset token', () =>
            request(app)
                .post(`${baseURL}/auth/reset-password`)
                .send({ email: testUser.email })
                .expect(httpStatus.OK)
                .then((res1) => {
                    resetToken = res1.body.token;
                    return request(app).post(`${baseURL}/auth/reset-password/${resetToken}`)
                        .send({ password: 'newerpass' })
                        .expect(httpStatus.OK)
                        .then(res2 => expect(res2.text).to.equal('OK'));
                })
        );

        it('should update the password', () =>
            request(app)
                .post(`${baseURL}/auth/reset-password`)
                .send({ email: testUser.email })
                .expect(httpStatus.OK)
                .then((res1) => {
                    resetToken = res1.body.token;
                    return request(app)
                        .post(`${baseURL}/auth/reset-password/${resetToken}`)
                        .send({ password: 'newerpass' })
                        .expect(httpStatus.OK)
                        .then(() => request(app)
                                .post(`${baseURL}/auth/login`)
                                .send({
                                    username: 'KK123',
                                    password: 'newerpass',
                                })
                                .expect(httpStatus.OK));
                })
        );
    });

    describe('POST /auth/update-password', () => {
        before(() => request(app)
            .post(`${baseURL}/user`)
            .send(testUser)
            .expect(httpStatus.OK)
        );

        after(() => User.destroy({ where: {} }));

        before(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(validUserCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                let decoded;
                if (config.jwtMode === 'rsa') {
                    const cert = fs.readFileSync(config.jwtPublicKeyPath);
                    decoded = jwt.verify(res.body.token, cert);
                } else {
                    decoded = jwt.verify(res.body.token, config.jwtSecret);
                }
                expect(decoded.username).to.equal(validUserCredentials.username);
                jwtToken = `Bearer ${res.body.token}`;
                return;
            })
        );

        it('should update user password when user is authenticated', () =>
            request(app)
                .post(`${baseURL}/auth/update-password`)
                .set('Authorization', jwtToken)
                .send({ password: 'newerpass' })
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.text).to.equal('OK');
                    return request(app).post(`${baseURL}/auth/login`)
                        .send({
                            username: 'KK123',
                            password: 'newerpass',
                        })
                        .expect(httpStatus.OK);
                })
        );

        it('should return 401 when user is not authenticated', () =>
            request(app)
                .post(`${baseURL}/auth/update-password`)
                .send({ password: 'newerpass' })
                .expect(httpStatus.UNAUTHORIZED)
                .then(res => expect(res.text).to.equal('Unauthorized'))
        );

        it('should return 401 when JWT is invalid', () =>
            request(app)
                .post(`${baseURL}/auth/update-password`)
                .set('Authorization', 'Bearer BadJWT')
                .send({ password: 'newerpass' })
                .expect(httpStatus.UNAUTHORIZED)
                .then(res => expect(res.text).to.equal('Unauthorized'))
        );

        it('should return 400 if password update is invalid', () =>
            request(app)
                .post(`${baseURL}/auth/update-password`)
                .set('Authorization', jwtToken)
                .send({ password: 'badpass' })
                .expect(httpStatus.BAD_REQUEST)
                .then(res => expect(res.text).to.contain('length must be at least 8 characters long'))
        );
    });
});
