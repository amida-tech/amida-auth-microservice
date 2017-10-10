import express from 'express';
import validate from 'express-validation';
import guard from 'express-jwt-permissions';
import passport from 'passport';
import { userValidation } from '../../config/param-validation';
import userCtrl from '../controllers/user.controller';

const router = express.Router(); // eslint-disable-line new-cap
const permissions = guard({ permissionsProperty: 'scopes' });

router.route('/')
    /** GET /api/users - Get list of users */
    .get(passport.authenticate('jwt', { session: false }),
         permissions.check('admin'),
         userCtrl.list)

    /** POST /api/users - Create new user */
    .post(validate(userValidation.createUser), userCtrl.create);

router.route('/me')
    .get(passport.authenticate('jwt', { session: false }),
         userCtrl.me);

router.route('/:userId')
    /** GET /api/users/:userId - Get user */
    .get(passport.authenticate('jwt', { session: false }),
         userCtrl.get)

    /** PUT /api/users/:userId - Update user */
    .put(validate(userValidation.updateUser),
         passport.authenticate('jwt', { session: false }),
         userCtrl.update)

    /** DELETE /api/users/:userId - Delete user */
    .delete(passport.authenticate('jwt', { session: false }),
            permissions.check('admin'),
            userCtrl.remove);

router.route('/scopes/:userId')
    /** PUT /api/user/scopes/:userId - Update user scopes */
    .put(validate(userValidation.updateUserScopes),
         passport.authenticate('jwt', { session: false }),
         permissions.check('admin'),
         userCtrl.updateScopes);

// Load user when API with userId route parameter is hit
// NOTE: this will be overwritten by the JWT user on protected routes
router.param('userId', userCtrl.load);

export default router;
