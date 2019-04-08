import express from 'express';
import validate from 'express-validation';
import passport from 'passport';
import authCtrl from '../controllers/auth.controller';
import { authValidation } from '../config/param-validation';
import { checkExternalProvider, signJWT } from '../helpers/jwt';
import { checkPassword } from '../helpers/owasp';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/login')
    .post(validate(authValidation.login), authCtrl.login);

router.route('/logout');

router.route('/token/reject')
    .post(validate(authValidation.refreshTokenReject), authCtrl.rejectRefreshToken);

router.route('/token')
    .post(validate(authValidation.refreshToken), authCtrl.submitRefreshToken);

router.route('/update-password')
    .post(validate(authValidation.updatePassword), checkPassword,
          passport.authenticate('jwt', { session: false }),
          checkExternalProvider,
          authCtrl.updatePassword);

router.route('/reset-password')
    .post(validate(authValidation.resetToken),
          authCtrl.resetToken);

router.route('/reset-password/:token')
    .post(validate(authValidation.resetPassword), checkPassword,
          authCtrl.resetPassword);

router.route('/verify-messaging-protocol')
    .post(validate(authValidation.verifyMessagingProtocolToken),
          authCtrl.verifyMessagingProtocol);

router.route('/facebook')
    .get(passport.authenticate('facebook', {
        session: false,
        scope: ['email'],
    }));

router.route('/facebook/callback')
    .get(passport.authenticate('facebook', {
        session: false,
        scope: ['email'],
    }), (req, res) => {
        const userInfo = {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            scopes: req.user.scopes,
        };

        const token = signJWT(userInfo);

        return res.json({
            token,
            username: userInfo.username,
        });
    });

export default router;
