
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

describe('Message API:', function () {

    before(function () {
        return Message.sync({
            force: true
        }).then(function () {
            return sequelize.query('DELETE FROM "Messages"', {
                type: sequelize.QueryTypes.DELETE
            });
        });
    });

    describe('POST /message/send', function () {

        it('should return OK');
        
        it('should return the sent Message object');

        it('should create a new Message in the DB');

        it('should have a createdAt timestamp');

        it('should have readAt set to NULL');

    });

    describe('GET /message/list/:userId', function () {

        it('should return OK');

        it('should return all Message addressed to a user');

        it('has an option to limit Message returned');

        it('has an option to limit by sender');

        it('has an option to return summaries');

    });
    
    describe('GET /message/count/:userId', function () {

        it('should return OK');

        it('should return a count for total Message');

        it('should return a count for unread Message');

    });
    
    describe('GET /message/get/:messageId', function () {

        it('should return OK');

        it('should return the specified Message');

        it('should mark the Message retrieved as read');

    });

    describe('DELETE /message/delete/:messageId', function () {

        it('should return OK');

        it('should return the deleted Message');

        it('should delete the message from the DB');

    });
    
});