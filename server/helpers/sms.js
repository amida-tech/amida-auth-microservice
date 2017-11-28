import twilio from 'twilio';
import config from '../../config/config';

module.exports = {
    sendSms(res, phoneNumber, text, token, next) {
        // eslint-disable-next-line
        const client = new twilio(config.twilio.accountSid, config.twilio.authToken);
        if (config.env === 'test') {
            res.status(200).json({
                token,
            });
        } else {
            client.messages.create({
                body: text,
                to: phoneNumber,  // Text this number
                from: config.twilio.fromPhoneNumber, // From a valid Twilio number
            })
            .then(() => res.status(200).end())
            .catch(error => next(error));
        }
    },
};
