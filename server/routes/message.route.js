import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import messageCtrl from '../controllers/message.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/send')
    .post(validate(paramValidation.sendMessage), messageCtrl.send);

router.route('/list/:userId')
    .get(messageCtrl.list);

router.route('/count/:userId')
    .get(messageCtrl.count);

router.route('/get/:messageId')
    .get(messageCtrl.get);

router.route('/delete/:messageId')
    .delete(messageCtrl.remove);

/** Load message when API with route parameter is hit */
router.param('messageId', messageCtrl.load);

export default router;
