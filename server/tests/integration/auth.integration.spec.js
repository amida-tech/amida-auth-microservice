/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */

import request from 'supertest-as-promised';
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

        it('should return 401 error with bad password', (done) => {
            request(app)
                .post(`${baseURL}/auth/login`)
                .send(badPassword)
                .expect(httpStatus.UNAUTHORIZED)
                .then((res) => {
                    expect(res.body.message).to.equal('Incorrect password');
                    done();
                })
                .catch(done);
        });

        it('should return 404 when there is no username found', (done) => {
            request(app)
                .post(`${baseURL}/auth/login`)
                .send(missingUsername)
                .expect(httpStatus.NOT_FOUND)
                .then((res) => {
                    expect(res.body.message).to.equal('Username not found');
                    done();
                })
                .catch(done);
        });

        it('should get valid JWT token', (done) => {
            request(app)
                .post(`${baseURL}/auth/login`)
                .send(validUserCredentials)
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body).to.have.property('token');
                    jwt.verify(res.body.token, config.jwtSecret, (err, decoded) => {
                        expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
                        expect(decoded.username).to.equal(validUserCredentials.username);
                        done();
                    });
                })
                .catch(done);
        });
    });

    // describe('# POST /auth/logout');

    describe('POST /auth/reset-password', () => {
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

        beforeEach((done) => {
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
                .post(`${baseURL}/auth/reset-password`)
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({
                    password: 'newerpass',
                })
                .expect(httpStatus.OK)
                .then((res) => {
                    expect(res.body.message).to.equal('OK');
                    done();
                })
                .catch(done);
        });

        it('should return 401 when user is not authenticated', (done) => {
            request(app)
                .post(`${baseURL}/auth/reset-password`)
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({
                    password: 'newerpass',
                })
                .expect(httpStatus.OK)
                .then(() => {
                    done();
                })
                .catch(done);
        });

        it('should return 401 when JWT is invalid', (done) => {
            request(app)
                .post(`${baseURL}/auth/reset-password`)
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({
                    password: 'newerpass',
                })
                .expect(httpStatus.OK)
                .then(() => {
                    done();
                })
                .catch(done);
        });

        it('should return 400 if password is invalid', (done) => {
            request(app)
                .post(`${baseURL}/auth/reset-password`)
                .set('Authorization', `Bearer ${jwtToken}`)
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
