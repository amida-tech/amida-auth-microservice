import Joi from 'joi';

export default {
    createUser: {
        body: {
            username: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).max(64).required(),
        },
    },
    updateUser: {
        body: {
            email: Joi.string().email(),
        },
    },
    login: {
        body: {
            username: Joi.string().required(),
            password: Joi.string().required(),
        },
    },
};
