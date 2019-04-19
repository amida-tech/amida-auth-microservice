/* eslint-env mocha */

import { fail } from 'assert';
import { expect } from 'chai';
import httpStatus from 'http-status';

import APIError from '../../src/helpers/APIError';

const causalErrorMessage = 'Causal error message';
const apiErrorMessage = 'APIError message';
const errorCode = 'ERROR_CODE';

describe('APIError:', () => {
    describe('isPublic:', () => {
        it('should default to true...', () => {
            const errWithoutOptions = new APIError('a', 'b', 'c');
            expect(errWithoutOptions.options).to.deep.equal({});
            expect(errWithoutOptions.isPublic).to.equal(true);

            const errWithOptionsButLackingIsPublic = new APIError('a', 'b', 'c', { optionA: 'A' });
            expect(errWithOptionsButLackingIsPublic.options).to.deep.equal({ optionA: 'A' });
            expect(errWithOptionsButLackingIsPublic.isPublic).to.equal(true);
        });

        it('should be settable via options.isPublic', () => {
            const errWithOptionsWithIsPublic = new APIError('a', 'b', 'c', { optionA: 'A', isPublic: false });
            expect(errWithOptionsWithIsPublic.options).to.deep.equal({ optionA: 'A', isPublic: false });
            expect(errWithOptionsWithIsPublic.isPublic).to.equal(false);
        });
    });

    describe('Causal Error Handling and isOperational:', () => {
        it('When a causal error is passed in, default isOperational to false', () => {
            const causalError = new Error(causalErrorMessage);
            const err = new APIError(causalError, apiErrorMessage);

            expect(err.isOperational).to.equal(false);
        });

        it('When a causal error is NOT passed in, default isOperational to true', () => {
            const err = new APIError(apiErrorMessage);

            expect(err.isOperational).to.equal(true);
        });

        it('`options.isOperational` overrides the default behavior', () => {
            const causalError = new Error(causalErrorMessage);
            const err1 = new APIError(causalError, apiErrorMessage, errorCode, httpStatus.NOT_FOUND, { isOperational: 'SOMETHING' });
            const err2 = new APIError(apiErrorMessage, errorCode, httpStatus.NOT_FOUND, { isOperational: 'SOMETHING' });

            expect(err1.isOperational).to.equal('SOMETHING');
            expect(err1.isOperational).to.equal(err1.options.isOperational);
            expect(err2.isOperational).to.equal('SOMETHING');
            expect(err2.isOperational).to.equal(err2.options.isOperational);
        });

        // Note: includeCausalError is true because .env.test sets LOG_LEVEL=debug
        describe('When includeCausalError is truthy...', () => {
            it('the causal error is set to myAPIError.cause', () => {
                const causalError = new Error(causalErrorMessage);
                const err = new APIError(causalError, apiErrorMessage);

                expect(err.cause).to.deep.equal(causalError);
            });

            it('"concatonate" messages of APIError and the causal errror', () => {
                const causalError = new Error(causalErrorMessage);
                const err = new APIError(causalError, apiErrorMessage);

                expect(err.message).to.equal(`${apiErrorMessage}: ${causalErrorMessage}`);
            });
        });

        // TODO: Mock APIError.js's call to `initLogLevelGte()` to force initialize it to a level
        // below 'debug' because .env.test has LOG_LEVEL=deug and APIError.js has:
        // ```
        // const logLevelGte = initLogLevelGte(config.logLevel);
        // const includeCausalError = logLevelGte('debug');
        // ```
        // Then, write tests for the following cases:
        // 1. Cases for: describe('When includeCausalError is falsy', () => {
        // 2. Cases related to options.includeCausalError
    });

    describe('Supports argument shifting based on first argument being a causal error, or not:', () => {
        it('Fist argument must be either an error or string', () => {
            try {
                new APIError(new Error('something')); // eslint-disable-line no-new
                new APIError('this can be any string literal'); // eslint-disable-line no-new
                new APIError(new String('something')); // eslint-disable-line no-new,no-new-wrappers
            } catch (err) {
                fail();
            }
        });

        it('Throws error when first arg is not an error or string', () => {
            try {
                new APIError(); // eslint-disable-line no-new
                // The error should get thrown, so this line should never run.
                fail();
            } catch (err) {
                expect(err.message).to.equal('Attempting to run APIError constructor failed: The first arg to the constructor must be a string or object that is instanceof Error.');
            }
        });

        it('Supports calling with causal error', () => {
            const causalError = new Error(causalErrorMessage);
            const err = new APIError(causalError, apiErrorMessage, errorCode, httpStatus.NOT_FOUND, { optionA: 'A', isPublic: false });

            expect(err.cause).to.deep.equal(causalError);
            expect(err.message).to.equal(`${apiErrorMessage}: ${causalErrorMessage}`);
            expect(err.code).to.equal(errorCode);
            expect(err.status).to.equal(httpStatus.NOT_FOUND);
            expect(err.options).to.deep.equal({ optionA: 'A', isPublic: false });
        });

        it('Supports calling without causal error', () => {
            const err = new APIError(apiErrorMessage, errorCode, httpStatus.NOT_FOUND, { optionA: 'A', isPublic: false });

            expect(err.cause).to.equal(undefined);
            expect(err.message).to.equal(apiErrorMessage);
            expect(err.code).to.equal(errorCode);
            expect(err.status).to.equal(httpStatus.NOT_FOUND);
            expect(err.options).to.deep.equal({ optionA: 'A', isPublic: false });
        });
    });

    describe('Error stacks:', () => {
        describe('There should be a stack when...', () => {
            it('There is a causal error', () => {
                const causalError = new Error();
                const err = new APIError(causalError);
                expect(err.stack).to.exist; // eslint-disable-line no-unused-expressions
            });

            // // TODO: Mock set config.alwaysIncludeErrorStacks before importing APIError.js
            // it('alwaysIncludeErrorStacks is truthy', () => {
            //     const err = new APIError('some string');
            //     expect(err.stack).to.exist; // eslint-disable-line no-unused-expressions
            // });

            it('options.includeStack is truthy', () => {
                const err = new APIError('message', 'CODE', 'http status', { includeStack: true });
                expect(err.stack).to.exist; // eslint-disable-line no-unused-expressions
            });
        });

        describe('There should not be a stack...', () => {
            it('In any other case', () => {
                const err = new APIError('some string');
                expect(err.stack).to.equal(undefined);
            });
        });
    });
});
