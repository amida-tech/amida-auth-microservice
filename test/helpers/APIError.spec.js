/* eslint-env mocha */

import { fail } from 'assert';
import { expect } from 'chai';
import httpStatus from 'http-status';

import APIError from '../../src/helpers/APIError';

const causalErrorMessage = 'Causal error message';
const apiErrorMessage = 'APIError message';
const errorCode = 'ERROR_CODE';

describe('APIError:', () => {
    describe('Default options.isPublic should be true...', () => {
        it('When options argument is not specified', () => {
            const errWithoutOptions = new APIError('a', 'b', 'c');
            expect(errWithoutOptions.options).to.deep.equal({ isPublic: true });
        });

        it('When options argument is specified, but no isPublic option specified', () => {
            const errWithOptionsButLackingIsPublic = new APIError('a', 'b', 'c', { optionA: 'A' });
            expect(errWithOptionsButLackingIsPublic.options).to.deep.equal({ optionA: 'A', isPublic: true });
        });
    });

    describe('Causal Error Handling:', () => {
        describe('When includeCausalError is truthy...', () => {
            it('The causal error is set to myAPIError.cause', () => {
                const causalError = new Error(causalErrorMessage);
                const err = new APIError(causalError, apiErrorMessage);

                expect(err.cause).to.deep.equal(causalError);
            });

            it('"Concatonate" messages of APIError and the causal errror', () => {
                const causalError = new Error(causalErrorMessage);
                const err = new APIError(causalError, apiErrorMessage);

                expect(err.message).to.equal(`${apiErrorMessage}: ${causalErrorMessage}`);
            });
        });

        // // TODO: This requires mocking `initLogLevelGte()` because APIError.js has
        // const logLevelGte = initLogLevelGte(config.logLevel);
        // describe('When includeCausalError is falsy', () => {
        //     it('myAPIError.cause is undefined', () => {
        //         const causalError = new Error(causalErrorMessage);
        //         const err = new APIError(causalError, apiErrorMessage);

        //         expect(err.cause).to.be.undefined; // eslint-disable-line no-unused-expressions
        //     });

        //     it('Don\'t "concatonate", messages of causal error and APIError', () => {
        //         const causalError = new Error(causalErrorMessage);
        //         const err = new APIError(causalError, apiErrorMessage);

        //         expect(err.message).to.equal(apiErrorMessage);
        //     });
        // });
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

            expect(err.cause).to.be.undefined; // eslint-disable-line no-unused-expressions
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
                expect(err.stack).to.be.undefined; // eslint-disable-line no-unused-expressions
            });
        });
    });
});
