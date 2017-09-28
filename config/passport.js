import {
    Strategy as JwtStrategy,
    ExtractJwt,
} from 'passport-jwt';
import fs from 'fs';
import { User } from './sequelize';
import config from './config';

var key;
if (config.jwtMode === 'rsa') {
    key = fs.readFileSync(config.jwtPublicKeyPath);
} else {
    key = config.jwtSecret;
}

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: key,
};

module.exports = (passport) => {
    passport.use(new JwtStrategy(opts, (jwtPayload, done) => {
        User.findOne({ where: { username: jwtPayload.username } })
            .then(user => done(null, user))
            .catch(err => done(err, false));
    }));
};

