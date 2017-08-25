import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import authCtrl from '../controllers/auth.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/create')
      .post(validate(paramValidation.createUser), authCtrl.create);

router.route('/me')
      .get(authCtrl.me);

export default router;