
/* eslint-disable */

import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import p from '../../package';
import {
    Message,
    sequelize
} from '../../config/sequelize';
import _ from 'lodash';

chai.use(require('chai-datetime'));

const version = p.version.split('.').shift();
const baseURL = (version > 0 ? `/api/v${version}` : '/api');

const testMessageObject = {
    to: ['user1'],
    from: 'user0',
    subject: 'Test Message',
    message: 'Test post please ignore',
};

describe('Message API:', function () {

    before(() => {
        return Message.sync({
            force: true
        });
    });
    
    after(() => {
        return Message.destroy({
            where: {},
            truncate: true
        });
    });

    describe('POST /message/send', function () {

        it('should return OK', done => {
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
        
        /**
         * Every recipient, plus the sender, gets their own version
         * of the message with the `owner` field set to their user ID.
         * Creating a message should return the sender's version of the message.
         */
        it('should return the sender Message object', done => {
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

        it('should create new Messages in the DB', done => {
            request(app)
                .post(baseURL + '/message/send')
                .send(testMessageObject)
                .expect(httpStatus.OK)
                .then(res => {
                    let id = res.body.id;
                    Message.findById(id)
                        .then(message => {
                            expect(message).to.deep.include(testMessageObject);
                            Message.findOne({where: {owner: testMessageObject.to[0]}})
                                .then(message => {
                                    expect(message).to.deep.include(testMessageObject);
                                    done();
                                });
                        });
                })
                .catch(done);
        });

        it('returned message should have a createdAt timestamp', done => {
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

        it('recipient message should have readAt set to NULL', done => {
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

        /**
         * Sent messages are considered read
         */
        it('sender message should have readAt set to createdAt time', done => {
            request(app)
                .post(baseURL + '/message/send')
                .send(testMessageObject)
                .expect(httpStatus.OK)
                .then(res => {
                    Message.findOne({where: {owner: testMessageObject.to[0]}})
                        .then(message => {
                            expect(message.readAt).to.be.not.null;
                            expect(message.readAt).to.equalDate(message.createdAt);
                            done();
                        });
                })
                .catch(done);
        });

    });

    describe('POST /message/reply/:messageId', () => {

        let messageId;
        
        before(done => {
            Message.create(testMessageObject)
                .then(message => {
                    messageId = message.id;
                    done();
                });
        });

        it('should return OK', done => {
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

        // TODO leaving these for Jacob to work on
        it('should return the response message owned by the sender');

        it('should create new messages in the DB with appropriate threaded message IDs');

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

        it('should return OK', done => {
            request(app)
                .get(baseURL + '/message/list' + userId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });

        it('should return all Message addressed to a user', done => {
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

        // TODO: Ruchita to write this test
        it('has an option to limit Message returned');

        // TODO: Ruchita to write this test
        it('has an option to limit by sender');

        // TODO: Ruchita to write this test
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

        it('should return OK', done => {
            request(app)
                .get(baseURL + '/message/count' + userId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });

        it('should return a count for total Messages', done => {
            request(app)
                .get(baseURL + '/message/count' + userId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body.total).to.equal(1);
                    done();
                })
                .catch(done);
        });

        it('should return a count for unread Messages', done => {
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

        it('should return OK', done => {
            request(app)
                .get(baseURL + '/message/get' + messageId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });

        it('should return the specified Message', done => {
            request(app)
                .get(baseURL + '/message/get' + messageId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body).to.deep.include(testMessageObject);
                    done();
                })
                .catch(done);
        });

        it('should mark the Message retrieved as read', done => {
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

    // TODO: this one is going to be hard
    describe('GET /message/thread/:originalMessageId', () => {
        
        let messageId;
        
        before(done => {
            Message.create(testMessageObject)
                .then(message => {
                    originalMessageId = message.originalMessageId;
                    done();
                });
        });

        // TODO: create a real response message here

        it('should return OK', done => {
            request(app)
                .get(baseURL + '/message/thread' + originalMessageId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.text).to.equal('OK');
                    done();
                })
                .catch(done);
        });

        it('should return an array of message IDs, starting with the original message', done => {
            request(app)
                .get(baseURL + '/message/thread' + originalMessageId)
                .expect(httpStatus.OK)
                .then(res => {
                    expect(res.body).to.be.an.array;
                    // TODO check specific IDs
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