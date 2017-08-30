import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import authCtrl from '../controllers/auth.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/login')
    .post(validate(paramValidation.login), authCtrl.login);

router.route('/logout');

export default router;
