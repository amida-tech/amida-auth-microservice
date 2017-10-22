import request from 'supertest';
import fs from 'fs';
import httpStatus from 'http-status';
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
