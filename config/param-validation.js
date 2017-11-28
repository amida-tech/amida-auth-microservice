import Joi from 'joi';

const userValidation = {
    createUser: {
        body: Joi.object().keys({
            email: Joi.string().email(),
            phone: Joi.string().regex(/^[0-9]{10}$/),
            username: Joi.string().required(),
            password: Joi.string().min(8).max(64).required(),
        }).or('email', 'phone'),
    },
    updateUser: {
        body: {
            email: Joi.string().email(),
        },
    },
    updateUserScopes: {
        body: {
            scopes: Joi.array().unique().items(Joi.string().allow('')).required(),
        },
    },
};

const authValidation = {
    updatePassword: {
        body: {
            password: Joi.string().min(8).max(64).required(),
        },
    },
    resetToken: {
        body: Joi.object().keys({
            email: Joi.string().email(),
            phone: Joi.string().regex(/^[0-9]{10}$/),
        }).or('email', 'phone'),
    },
    // resetToken: Joi.object().keys({
    //     email: Joi.string().email(),
    //     phone: Joi.number().min(1000000000).max(9999999999),
    // }).or('email', 'phone'),

    resetPassword: {
        body: {
            password: Joi.string().min(8).max(64).required(),
        },
    },
    login: {
        body: {
            username: Joi.string().required(),
            password: Joi.string().required(),
        },
    },
};

export default {
    userValidation,
    authValidation,
};
