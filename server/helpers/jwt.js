import fs from 'fs';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import APIError from '../helpers/APIError';

module.exports = {

    signJWT(userInfo) {
        if (config.jwtMode === 'rsa') {
            const cert = fs.readFileSync(config.jwtPrivateKeyPath);  // get private key
            return jwt.sign(userInfo, cert, { algorithm: 'RS256', expiresIn: '1h' });
        }
        return jwt.sign(userInfo, config.jwtSecret, { expiresIn: '1h' });
    },

    /* middleware function to check if a user account
     * was created using an external auth provider
     */
    checkExternalProvider(req, res, next) {
        if (req.user.provider !== null) {
            const err = new APIError('Cannot call this endpoint for user managed with external auth', httpStatus.FORBIDDEN, true);
            return next(err);
        }
        return next();
    },

};
