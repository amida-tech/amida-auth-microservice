import express from 'express';
import validate from 'express-validation';
import guard from 'express-jwt-permissions';
import passport from 'passport';
import { userValidation } from '../../config/param-validation';
import userCtrl from '../controllers/user.controller';
import { checkExternalProvider } from '../helpers/jwt';
import { checkPassword } from '../helpers/owasp';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap
const permissions = guard({ permissionsProperty: 'scopes' });

// This array will remain empty if admin user is not required
// TODO: a more granular registrar role, rather than admin
let userAdminFunctions = [];
if (config.onlyAdminCanCreateUsers) {
    userAdminFunctions = [
        passport.authenticate('jwt', { session: false }),
        permissions.check('admin'),
    ];
}

router.route('/')
    /** GET /api/user - Get list of users */
    .get(passport.authenticate('jwt', { session: false }),
         permissions.check('admin'),
         userCtrl.list)

    /** POST /api/user - Create new user */
    .post(validate(userValidation.createUser), checkPassword,
          ...userAdminFunctions,
          userCtrl.create);

router.route('/me')
    .get(passport.authenticate('jwt', { session: false }),
         userCtrl.me);

router.route('/:userId')
    /** GET /api/user/:userId - Get user */
    .get(passport.authenticate('jwt', { session: false }),
         userCtrl.get)

    /** PUT /api/user/:userId - Update user */
    .put(validate(userValidation.updateUser),
         passport.authenticate('jwt', { session: false }),
         checkExternalProvider,
         userCtrl.update)

    /** DELETE /api/user/:userId - Delete user */
    .delete(passport.authenticate('jwt', { session: false }),
            permissions.check('admin'),
            userCtrl.remove);

router.route('/byEmail/:userEmail')
    /** GET /api/user/:userId - Get user */
    .get(passport.authenticate('jwt', { session: false }),
            userCtrl.getByEmail);

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
