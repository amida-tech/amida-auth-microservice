/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */

import request from 'supertest';
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
const baseURL = (version > 0 ? `/api/v${version}` : '/api');

const user = {
    username: 'KK123',
    email: 'test@amida.com',
    password: 'testpass',
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

    after(() => User.drop({
        force: true,
    }));

    let jwtToken;

    describe('POST /auth/login', () => {
        before(() => request(app)
            .post(`${baseURL}/user`)
            .send(user)
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
                    const decoded = jwt.verify(res.body.token, config.jwtSecret);
                    expect(decoded.username).to.equal(validUserCredentials.username);
                })
        );
    });

    // TODO describe('# POST /auth/logout');

    describe('POST /auth/reset-password', () => {
        before(() => request(app)
            .post(`${baseURL}/user`)
            .send(user)
            .expect(httpStatus.OK)
        );

        after(() => User.destroy({ where: {} }));

        before(() => request(app)
            .post(`${baseURL}/auth/login`)
            .send(validUserCredentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                const decoded = jwt.verify(res.body.token, config.jwtSecret);
                expect(decoded.username).to.equal(validUserCredentials.username);
                jwtToken = `Bearer ${res.body.token}`;
            })
        );

        let resetToken;

        xit('should set the password to a random string', (done) => {
            request(app)
                .post(`${baseURL}/auth/reset-password`)
                .send({
                    email: user.email,
                })
                .expect(httpStatus.OK)
                .then((res) => {
                    // check User for password
                    done();
                })
                .catch(done);
        });

        it('should generate a token (test env only)', () =>
            request(app).post(`${baseURL}/auth/reset-password`)
                .send({ email: user.email })
                .expect(httpStatus.OK)
                .then(res => expect(res.body.token).to.exist)
        );

        it('should accept the reset token', () =>
            request(app).post(`${baseURL}/auth/reset-password`)
                .send({ email: user.email })
                .expect(httpStatus.OK)
                .then((res1) => {
                    resetToken = res1.body.token;
                    return request(app).post(`${baseURL}/auth/reset-password/${resetToken}`)
                        .send({ password: 'newerpass' })
                        .expect(httpStatus.OK)
                        .then(res2 => expect(res2.text).to.equal('OK'));
                })
        );

        xit('should update the password', (done) => {
            request(app)
                .post(`${baseURL}/auth/reset-password`)
                .send({
                    email: user.email,
                })
                .expect(httpStatus.OK)
                .then((res) => {
                    resetToken = res.body.token;
                    request(app)
                        .post(`${baseURL}/auth/reset-password/${resetToken}`)
                        .send({
                            password: 'newerpass',
                        })
                        .expect(httpStatus.OK)
                        .then((res) => {
                            // check User for password
                            done();
                        })
                        .catch(done);
                })
                .catch(done);
        });
    });

    describe('POST /auth/update-password', () => {
        before((done) => {
            request(app)
                .post(`${baseURL}/user`)
                .send(user)
                .expect(httpStatus.OK)
                .then(() => {
                    done();
                })
                .catch(done);
        });

        after(() => User.destroy({ where: {} }));

        before((done) => {
            request(app)
                .post(`${baseURL}/auth/login`)
                .send(validUserCredentials)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body).to.have.property('token');
                    jwt.verify(res.body.token, config.jwtSecret, (err, decoded) => {
                        expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
                        expect(decoded.username).to.equal(validUserCredentials.username);
                        jwtToken = `Bearer ${res.body.token}`;
                        done();
                    });
                })
                .catch(done);
        });

        it('should update user password when user is authenticated', (done) => {
            request(app)
                .post(`${baseURL}/auth/update-password`)
                .set('Authorization', jwtToken)
                .send({
                    password: 'newerpass',
                })
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });

        it('should return 401 when user is not authenticated', (done) => {
            request(app)
                .post(`${baseURL}/auth/update-password`)
                .send({
                    password: 'newerpass',
                })
                .expect(httpStatus.UNAUTHORIZED)
                .then((res) => {
                    expect(res.text).to.equal('Unauthorized');
                    done();
                })
                .catch(done);
        });

        it('should return 401 when JWT is invalid', (done) => {
            request(app)
                .post(`${baseURL}/auth/update-password`)
                .set('Authorization', 'Bearer BadJWT')
                .send({
                    password: 'newerpass',
                })
                .expect(httpStatus.UNAUTHORIZED)
                .then((res) => {
                    expect(res.text).to.equal('Unauthorized');
                    done();
                })
                .catch(done);
        });

        it('should return 400 if password is invalid', (done) => {
            request(app)
                .post(`${baseURL}/auth/update-password`)
                .set('Authorization', jwtToken)
                .send({
                    password: 'badpass',
                })
                .expect(httpStatus.BAD_REQUEST)
                .then((res) => {
                    expect(res.text).to.contain('length must be at least 8 characters long');
                    done();
                })
                .catch(done);
        });
    });
});
