import util from 'util';
import nodemailer from 'nodemailer';
import config from '../config/config';

module.exports = {

    sendEmail(res, email, subject, text, next) {
        const options = {
            from: util.format('"%s"', config.mailer.fromAddress),
            to: email,
            subject,
            text,
        };
        if (config.env === 'test') {
            res.status(200).json({
                options,
            });
        } else {
            const transporter = nodemailer.createTransport({
                service: config.mailer.service,
                auth: {
                    user: config.mailer.user,
                    pass: config.mailer.password,
                },
            });
            transporter.sendMail(options, (err) => {
                if (err) {
                    return next(err);
                }
                return res.status(200).end();
            });
        }
    },

    generateLink(resetPageUrl, token) {
        return util.format('%s/%s', resetPageUrl, token);
    },

};
