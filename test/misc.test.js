/* eslint-env mocha */

import request from 'supertest';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../src/index';

chai.config.includeStack = true;

describe('## Misc', () => {
    describe('# GET /api/health-check', () => {
        it('should return OK', () => request(app)
            .get('/api/health-check')
            .expect(httpStatus.OK)
            .then(res => expect(res.text).to.equal('{"status":"ok"}'))
        );
    });

    describe('# GET /api/404', () => {
        it('should return 404 status', () => request(app)
            .get('/api/404')
            .expect(httpStatus.NOT_FOUND)
            .then(res => expect(res.body.message).to.equal('Not Found'))
        );
    });

    describe('# GET /actuator', () => {
        it('/info should return app information', () => request(app)
            .get('/actuator/info')
            .expect(httpStatus.OK)
            .then(res => expect(res.body.build).to.exist)
        );

        it('/metrics should return app metrics', () => request(app)
            .get('/actuator/metrics')
            .expect(httpStatus.OK)
            .then(res => expect(res.body.mem).to.exist)
        );
    });
});
