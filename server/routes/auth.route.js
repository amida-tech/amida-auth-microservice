import express from 'express';
import validate from 'express-validation';
import passport from 'passport';
import paramValidation from '../../config/param-validation';
import authCtrl from '../controllers/auth.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/login')
    .post(validate(paramValidation.login), authCtrl.login);

router.route('/logout');

router.route('/update-password')
    .post(validate(paramValidation.updatePassword),
          passport.authenticate('jwt', { session: false }),
          authCtrl.updatePassword);

router.route('/reset-password')
    .post(validate(paramValidation.resetToken),
          authCtrl.resetToken);

router.route('/reset-password/:token')
    .post(validate(paramValidation.resetPassword),
          authCtrl.resetPassword);

export default router;
