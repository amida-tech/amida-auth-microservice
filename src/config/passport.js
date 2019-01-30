import {
    Strategy as JwtStrategy,
    ExtractJwt,
} from 'passport-jwt';
import {
    Strategy as FacebookStrategy,
} from 'passport-facebook';
import fs from 'fs';
import httpStatus from 'http-status';
import { User } from './sequelize';
import config from './config';
import APIError from '../helpers/APIError';

let key;
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
    const jwtStrategy = new JwtStrategy(opts, (jwtPayload, done) => {
        User.findOne({ where: { username: jwtPayload.username } })
            .then(user => done(null, user))
            .catch(err => done(err, false));
    });

    passport.use(jwtStrategy);

    if (config.facebook.clientId) {
        const fbStrategy = new FacebookStrategy({
            clientID: config.facebook.clientId,
            clientSecret: config.facebook.clientSecret,
            callbackURL: config.facebook.callbackUrl,
            profileFields: ['email'],
        }, (accessToken, refreshToken, profile, done) => {
            const email = profile.emails[0].value;
            User.findOrCreate({ where: {
                username: email,
                email,
                provider: profile.provider,
            } })
            .spread((user) => {
                if (user !== null) return done(null, user);
                const err = new APIError('New facebook user not created', 'FACEBOOK_CREATION_ERROR', httpStatus.INTERNAL_SERVER_ERROR, true);
                return done(err);
            });
        });

        passport.use(fbStrategy);
    }
};
