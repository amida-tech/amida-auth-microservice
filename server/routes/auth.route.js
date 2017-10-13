import express from 'express';
import validate from 'express-validation';
import passport from 'passport';
import { authValidation } from '../../config/param-validation';
import authCtrl from '../controllers/auth.controller';
import { checkExternalProvider, signJWT } from '../helpers/jwt';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/login')
    .post(validate(authValidation.login), authCtrl.login);

router.route('/logout');

router.route('/update-password')
    .post(validate(authValidation.updatePassword),
          passport.authenticate('jwt', { session: false }),
          checkExternalProvider,
          authCtrl.updatePassword);

router.route('/reset-password')
    .post(validate(authValidation.resetToken),
          authCtrl.resetToken);

router.route('/reset-password/:token')
    .post(validate(authValidation.resetPassword),
          authCtrl.resetPassword);

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
