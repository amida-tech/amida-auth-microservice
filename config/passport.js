import {
    Strategy as JwtStrategy,
    ExtractJwt,
} from 'passport-jwt';
import { User } from './sequelize';
import config from './config';

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtSecret,
};

module.exports = (passport) => {
    passport.use(new JwtStrategy(opts, (jwtPayload, done) => {
        User.findOne({ where: { username: jwtPayload.username } })
            .then(user => done(null, user))
            .catch(err => done(err, false));
    }));
};

