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
        User.findOne({ where: { username: jwtPayload.username } }, (err, user) => {
            if (err) {
                return done(err, false);
            } else if (user) {
                return done(null, user);
            }
            return done(null, false);
                // or you could create a new account
        });
    }));
};

