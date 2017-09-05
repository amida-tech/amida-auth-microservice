import util from 'util';
import nodemailer from 'nodemailer';
import config from '../../config/config';

module.exports = {

    sendEmail(res, email, text, token, next) {
        const options = {
            from: util.format('"%s" <%s>', config.emailName, config.emailFrom),
            to: email,
            subject: 'Password Reset',
            text,
        };
        if (config.env === 'test') {
            res.status(200).json({
                token,
            });
        } else {
            const transporter = nodemailer.createTransport(config.emailUri);
            transporter.sendMail(options, (err) => {
                if (err) {
                    return next(err);
                }
                return res.status(200).end();
            });
        }
    },

    generateLink(req, token) {
        return util.format('http://%s/reset-password/%s', req.headers.host, token);
    },

};

