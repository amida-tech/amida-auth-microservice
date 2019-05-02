import express from 'express';
import validate from 'express-validation';
import passport from 'passport';
import authCtrl from '../controllers/auth.controller';
import { authValidation } from '../config/param-validation';
import { checkExternalProvider, signJWT } from '../helpers/jwt';
import { checkPassword } from '../helpers/owasp';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/login')
// Setting `AUTH_SERVICE_REQUIRE_ACCOUNT_VERIFICATION` or
// `AUTH_SERVICE_REQUIRE_SECURE_ACCOUNT_VERIFICATION` to `true` will force a
// user to verify their email address before this endpoint will 200.
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
// Setting `AUTH_SERVICE_REQUIRE_ACCOUNT_VERIFICATION` or
// `AUTH_SERVICE_REQUIRE_SECURE_ACCOUNT_VERIFICATION` to `true` will force a
// user to verify their email address before this endpoint will 200.
    .post(validate(authValidation.resetToken),
          authCtrl.resetToken);

router.route('/reset-password/:token')
// This endpoint specifically does not require email verification.
    .post(validate(authValidation.resetPassword), checkPassword,
          authCtrl.resetPassword);

router.route('/dispatch-verification-request')
// Triggers the dispatching of a verification request for a messaging protocol.
// Currently only supports sending a verification email for the email address
// provided in the User's email column.
    .post(validate(authValidation.dispatchVerificaitonRequest),
          authCtrl.dispatchVerificaitonRequest);

router.route('/provide-verifying-user')
// Returns the username of a user when provided with a non-epxired
// `contactMethodVerificationToken`.
    .post(validate(authValidation.getVerifyingUser),
           authCtrl.getVerifyingUser);

router.route('/verify-messaging-protocol')
// Adds a user's messaging protocol identity to `verifiedContactMethods`
    .post(validate(authValidation.verifyMessagingProtocol),
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
