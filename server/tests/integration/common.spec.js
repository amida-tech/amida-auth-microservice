import request from 'supertest';
import fs from 'fs';
import httpStatus from 'http-status';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import p from '../../../package';
import config from '../../../config/config';

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

module.exports = {

    /**
     * app - supertest object
     * credentials - username/password object
     * returns: auth header string in a promise
     */
    login: function login(app, credentials) {
        return request(app)
            .post(`${baseURL}/auth/login`)
            .send(credentials)
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body).to.have.property('token');
                return Promise.resolve(`Bearer ${res.body.token}`);
            });
    },

    testEmailUpdate: function testEmailUpdate(app, token, userId) {
        return request(app)
            .put(`${baseURL}/user/${userId}`)
            .set('Authorization', token)
            .send({ email: 'newemail@email.com' })
            .expect(httpStatus.OK)
            .then((res) => {
                expect(res.body.id).to.equal(userId);
                expect(res.body.email).to.equal('newemail@email.com');
                return;
            });
    },

    setupTestUser: function setupTestUser(app) {
        return request(app)
            .post(`${baseURL}/user`)
            .send(testUser)
            .expect(httpStatus.OK);
    },

    decodeToken: function decodeToken(token) {
        let decoded;
        if (config.jwtMode === 'rsa') {
            const cert = fs.readFileSync(config.jwtPublicKeyPath);
            decoded = jwt.verify(token, cert);
        } else {
            decoded = jwt.verify(token, config.jwtSecret);
        }
        return decoded;
    },

    testUser,
    badPassword,
    missingUsername,
    validUserCredentials,
    baseURL,
};
