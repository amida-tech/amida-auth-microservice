
/* eslint-disable */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import {
    Message,
    sequelize
} from '../../config/sequelize';
import _ from 'lodash';

const baseURL = '/api/v1';

const testMessageObject = {
    to: ['user1'],
    from: 'user0',
    subject: 'Test Message',
    message: 'Test post please ignore',
};

describe('Message API:', function () {

    before(() => {
        Message.sync({
            force: true
        });
    });
    
    after(() => {
        Message.destroy({
            where: {},
            truncate: true
        });
    });

    describe('POST /message/send', function () {

        xit('should return OK', done => {
            request(app)
                .post(baseURL + '/message/send')
                .send(testMessageObject)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });
        
        xit('should return the sent Message object', done => {
            request(app)
                .post(baseURL + '/message/send')
                .send(testMessageObject)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body).to.deep.include(testMessageObject);
                    done();
                })
                .catch(done);
        });

        xit('should create a new Message in the DB', done => {
            request(app)
                .post(baseURL + '/message/send')
                .send(testMessageObject)
                .expect(httpStatus.OK)
                .then(res => {
                    let id = res.body.id;
                    Message.findById(id)
                        .then(message => {
                            expect(message).to.deep.include(testMessageObject);
                            done();
                        });
                })
                .catch(done);
        });

        xit('should have a createdAt timestamp', done => {
            request(app)
                .post(baseURL + '/message/send')
                .send(testMessageObject)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body.createdAt).to.not.be.null;
                    expect(res.body.createdAt).to.not.be.undefined;
                    done();
                })
                .catch(done);
        });

        xit('should have readAt set to NULL', done => {
            request(app)
                .post(baseURL + '/message/send')
                .send(testMessageObject)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body.readAt).to.be.null;
                    done();
                })
                .catch(done);
        });

    });

    describe('GET /message/list/:userId', function () {

        let userId;

        before(done => {
            Message.create(testMessageObject)
                .then(message => {
                    userId = message.from;
                    done();
                });
        });

        xit('should return OK', done => {
            request(app)
                .get(baseURL + '/message/list' + userId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });

        xit('should return all Message addressed to a user', done => {
            request(app)
                .get(baseURL + '/message/list' + userId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body)
                        .to.be.an('array')
                        .that.deep.includes(testMessageObject);
                    done();
                })
                .catch(done);
        });

        it('has an option to limit Message returned');

        it('has an option to limit by sender');

        it('has an option to return summaries');

    });
    
    describe('GET /message/count/:userId', function () {

        let userId;

        before(done => {
            Message.destroy({
                where: {},
                truncate: true
            }).then(() => {
                Message.create(testMessageObject)
                    .then(message => {
                        userId = message.from;
                        done();
                    });
            });
        });

        xit('should return OK', done => {
            request(app)
                .get(baseURL + '/message/count' + userId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });

        xit('should return a count for total Message', done => {
            request(app)
                .get(baseURL + '/message/count' + userId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body.total).to.equal(1);
                    done();
                })
                .catch(done);
        });

        xit('should return a count for unread Message', done => {
            request(app)
                .get(baseURL + '/message/count' + userId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body.unread).to.equal(1);
                    done();
                })
                .catch(done);
        });

    });
    
    describe('GET /message/get/:messageId', function () {

        let messageId;
        
        before(done => {
            Message.create(testMessageObject)
                .then(message => {
                    messageId = message.id;
                    done();
                });
        });

        xit('should return OK', done => {
            request(app)
                .get(baseURL + '/message/get' + messageId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });

        xit('should return the specified Message', done => {
            request(app)
                .get(baseURL + '/message/get' + messageId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body).to.deep.include(testMessageObject);
                    done();
                })
                .catch(done);
        });

        xit('should mark the Message retrieved as read', done => {
            request(app)
                .get(baseURL + '/message/get' + messageId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body.readAt).to.not.be.null;
                    expect(res.body.readAt).to.be.a('Date');
                    done();
                })
                .catch(done);
        });

    });

    describe('DELETE /message/delete/:messageId', function () {

        let messageId;
        
        beforeEach(done => {
            Message.destroy({
                where: {},
                truncate: true
            }).then(() => {
                Message.create(testMessageObject)
                    .then(message => {
                        messageId = message.id;
                        done();
                    });
            });
        });

        xit('should return OK', done => {
            request(app)
                .delete(baseURL + '/message/delete' + messageId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });

        xit('should return the deleted Message', done => {
            request(app)
                .delete(baseURL + '/message/delete' + messageId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body).to.deep.include(testMessageObject);
                    done();
                })
                .catch(done);
        });

        xit('should delete the message from the DB', done => {
            request(app)
                .delete(baseURL + '/message/delete' + messageId)
                .expect(httpStatus.OK)
                .then(res => {
                    let id = res.body.id;
                    Message.findById(id)
                        .then(message => {
                            expect(message).to.be.null;
                            done();
                        });
                })
                .catch(done);
        });

    });
    
});