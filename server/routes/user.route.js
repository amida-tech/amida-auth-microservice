import express from 'express';
import validate from 'express-validation';
import guard from 'express-jwt-permissions';
import passport from 'passport';
import paramValidation from '../../config/param-validation';
import userCtrl from '../controllers/user.controller';

const router = express.Router(); // eslint-disable-line new-cap
const permissions = guard({permissionsProperty: 'scopes'});

router.route('/')
    /** GET /api/users - Get list of users */
    .get(userCtrl.list)

    /** POST /api/users - Create new user */
    .post(validate(paramValidation.createUser), userCtrl.create);

router.route('/:userId')
    /** GET /api/users/:userId - Get user */
    .get(userCtrl.get)

    /** PUT /api/users/:userId - Update user */
    .put(validate(paramValidation.updateUser), userCtrl.update)

    /** DELETE /api/users/:userId - Delete user */
    .delete(userCtrl.remove);

router.route('/scopes/:userId')
    /** PUT /api/users/scopes/:userId - Update user scopes */
    .put(validate(paramValidation.updateUserScopes),
         passport.authenticate('jwt', { session: false }),
         permissions.check('admin'),
         userCtrl.updateScopes);

router.route('/me')
    .get(userCtrl.me);

/** Load user when API with userId route parameter is hit */
router.param('userId', userCtrl.load);

export default router;
