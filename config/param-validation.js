import Joi from 'joi';

const userValidation = {
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
};

const authValidation = {
    updatePassword: {
        body: {
            password: Joi.string().min(8).max(64).required(),
        },
    },
    resetToken: {
        body: {
            email: Joi.string().email(),
            phone: Joi.number().min(1000000000).max(9999999999),
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

export default {
    userValidation,
    authValidation,
};
