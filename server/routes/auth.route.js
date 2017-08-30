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

router.route('/forgot-password');

export default router;
