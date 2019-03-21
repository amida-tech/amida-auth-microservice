import request from 'supertest';
import fs from 'fs';
import httpStatus from 'http-status';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import p from '../../package';
import config from '../../src/config/config';
import { User } from '../../src/config/sequelize';

const version = p.version.split('.').shift();
const baseURL = `/api/v${version}`;

const adminUser = {
    username: 'amidaadmin',
    email: 'superadmin@amida.com',
    password: 'Adminpass123',
    scopes: ['admin'],
};

const testUser = {
    username: 'KK123',
    email: 'test@amida.com',
    password: 'Testpass123',
    scopes: ['admin'],
};

const badPassword = {
    username: 'KK123',
    password: 'badpassword',
};

const missingUsername = {
    username: 'missing',
    password: 'Testpass123',
};

const validUserCredentials = {
    username: 'KK123',
    password: 'Testpass123',
};

const passwordResetPageUrl = 'http://test-url.com/reset-password';

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

    seedAdminAndLogin: function seedAdminAndLogin(app) {
        return User
            .create(adminUser)
            .then(() => request(app)
                .post(`${baseURL}/auth/login`)
                .send({
                    username: adminUser.username,
                    password: adminUser.password,
                })
                .then(res => Promise.resolve(res.body.token)))
            .catch(() => request(app)
                .post(`${baseURL}/auth/login`)
                .send({
                    username: adminUser.username,
                    password: adminUser.password,
                })
                .then(res => Promise.resolve(res.body.token))
            );
    },

    createUser: function createUser(app, userData, adminToken) {
        return request(app)
            .post(`${baseURL}/user`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(userData)
            .expect(httpStatus.OK)
            .then((res) => {
                const userId = res.body.id;
                return Promise.resolve(userId);
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

    setupTestUser: function setupTestUser(app, adminToken) {
        return request(app)
            .post(`${baseURL}/user`)
            .set('Authorization', `Bearer ${adminToken}`)
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
    passwordResetPageUrl,
};
