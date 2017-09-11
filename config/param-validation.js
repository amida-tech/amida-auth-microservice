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
    updateUserScopes: {
        body: {
            scopes: Joi.array().unique().items(Joi.string().allow('')).required(),
        },
    },
    updatePassword: {
        body: {
            password: Joi.string().min(8).max(64).required(),
        },
    },
    resetToken: {
        body: {
            email: Joi.string().email().required(),
        },
    },
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
