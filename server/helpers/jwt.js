import fs from 'fs';
import jwt from 'jsonwebtoken';
import config from '../../config/config';

module.exports = {

    signJWT(userInfo) {
        if (config.jwtMode === 'rsa') {
            const cert = fs.readFileSync(config.jwtPrivateKeyPath);  // get private key
            return jwt.sign(userInfo, cert, { algorithm: 'RS256', expiresIn: '1h' });
        }
        return jwt.sign(userInfo, config.jwtSecret, { expiresIn: '1h' });
    },

};
