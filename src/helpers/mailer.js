import util from 'util';
import nodemailer from 'nodemailer';
import config from '../config/config';

module.exports = {

    sendEmail(res, email, subject, text, attributes, next) {
        const options = {
            from: util.format('"%s"', config.mailer.fromAddress),
            to: email,
            subject,
            text,
            // attributes is needed here only for the purpose of testing, use this to pass in
            // tokens or other values needed for validation from the response.
            attributes,
        };
        if (config.env === 'test') {
            // pass anything sent as `attributes` through to the next step in the response body for
            // testing purposes
            res.status(200).json({
                attributes,
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
