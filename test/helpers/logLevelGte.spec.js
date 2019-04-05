/* eslint-env mocha */

import { expect } from 'chai';
import { fail } from 'assert';

import logLevelGte from '../../src/helpers/logLevelGte';

describe('#logLevelGte()', () => {
    it('Throws error if called with invalid log level', () => {
        try {
            logLevelGte('not_a_real_log_level');
            fail();
        } catch (err) {
            expect(err.message).to.equal("logLevelGte(): 'checkLogLevel' is not_a_real_log_level, but it must be one of the valid levels ('error', 'warn', 'info', 'verbose', 'debug', 'silly').");
        }
    });

    it('Works when config.logLevel=debug', () => {
        expect(logLevelGte('error')).to.be.true; // eslint-disable-line no-unused-expressions
        expect(logLevelGte('warn')).to.be.true; // eslint-disable-line no-unused-expressions
        expect(logLevelGte('info')).to.be.true; // eslint-disable-line no-unused-expressions
        expect(logLevelGte('verbose')).to.be.true; // eslint-disable-line no-unused-expressions
        expect(logLevelGte('debug')).to.be.true; // eslint-disable-line no-unused-expressions
        expect(logLevelGte('silly')).to.be.false; // eslint-disable-line no-unused-expressions
    });
});
