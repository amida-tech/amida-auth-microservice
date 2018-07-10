import Joi from 'joi';

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string()
        .allow(['development', 'production', 'test', 'provision'])
        .default('development'),
    PORT: Joi.number()
        .default(4000),
    CREATE_USER_ADMIN: Joi.bool()
        .default(true),
    JWT_MODE: Joi.string().allow(['rsa', 'hmac']).default('hmac')
        .description('Signing algorithm for JWT'),
    JWT_SECRET: Joi.string()
        .description('JWT Secret required to sign'),
    JWT_PRIVATE_KEY_PATH: Joi.string()
        .description('Absolute or relative path to RSA private key'),
    JWT_PUBLIC_KEY_PATH: Joi.string()
        .description('Absolute or relative path to RSA public key'),
    JWT_TTL: Joi.number()
        .default(3600),
    REFRESH_TOKEN_ENABLED: Joi.bool()
        .default(false),
    REFRESH_TOKEN_MULTIPLE_DEVICES: Joi.bool()
        .default(false),
    PG_DB: Joi.string().required()
        .description('Postgres database name'),
    PG_PORT: Joi.number()
        .default(5432),
    PG_HOST: Joi.string()
        .default('localhost'),
    PG_USER: Joi.string().required()
        .description('Postgres username'),
    PG_PASSWD: Joi.string().allow('')
        .description('Postgres password'),
    PG_SSL: Joi.bool()
        .default(false)
        .description('Enable SSL connection to PostgreSQL'),
    PG_CERT_CA: Joi.string()
        .description('SSL certificate CA'), // Certificate itself, not a filename
    MAILER_EMAIL_ID: Joi.string().allow(''),
    MAILER_PASSWORD: Joi.string().allow(''),
    MAILER_FROM_EMAIL_ADDRESS: Joi.string().allow(''),
    MAILER_SERVICE_PROVIDER: Joi.any().valid(
        '126',
        '163',
        '1und1',
        'AOL',
        'DebugMail',
        'DynectEmail',
        'FastMail',
        'GandiMail',
        'Gmail',
        'Godaddy',
        'GodaddyAsia',
        'GodaddyEurope',
        'hot.ee',
        'Hotmail',
        'iCloud',
        'mail.ee',
        'Mail.ru',
        'Maildev',
        'Mailgun',
        'Mailjet',
        'Mailosaur',
        'Mandrill',
        'Naver',
        'OpenMailBox',
        'Outlook365',
        'Postmark',
        'QQ',
        'QQex',
        'SendCloud',
        'SendGrid',
        'SendinBlue',
        'SendPulse',
        'SES',
        'SES-US-EAST-1',
        'SES-US-WEST-2',
        'SES-EU-WEST-1',
        'Sparkpost',
        'Yahoo',
        'Yandex',
        'Zoho',
        'qiye.aliyun'
    ).allow(''),
    FACEBOOK_CLIENT_ID: Joi.string(),
    FACEBOOK_CLIENT_SECRET: Joi.string(),
    FACEBOOK_CALLBACK_URL: Joi.string(),
}).unknown()
    .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    createUserAdmin: envVars.CREATE_USER_ADMIN,
    jwtMode: envVars.JWT_MODE,
    jwtSecret: envVars.JWT_SECRET,
    jwtPrivateKeyPath: envVars.JWT_PRIVATE_KEY_PATH,
    jwtPublicKeyPath: envVars.JWT_PUBLIC_KEY_PATH,
    jwtExpiresIn: envVars.JWT_TTL,
    refreshToken: {
        enabled: envVars.REFRESH_TOKEN_ENABLED,
        multipleDevices: envVars.REFRESH_TOKEN_MULTIPLE_DEVICES,
    },
    postgres: {
        db: envVars.PG_DB,
        port: envVars.PG_PORT,
        host: envVars.PG_HOST,
        user: envVars.PG_USER,
        passwd: envVars.PG_PASSWD,
        ssl: envVars.PG_SSL,
        ssl_ca_cert: envVars.PG_CERT_CA,
    },
    mailer: {
        user: envVars.MAILER_EMAIL_ID,
        password: envVars.MAILER_PASSWORD,
        fromAddress: envVars.MAILER_FROM_EMAIL_ADDRESS,
        service: envVars.MAILER_SERVICE_PROVIDER,
    },
    facebook: {
        clientId: envVars.FACEBOOK_CLIENT_ID,
        clientSecret: envVars.FACEBOOK_CLIENT_SECRET,
        callbackUrl: envVars.FACEBOOK_CALLBACK_URL,
    },
};

export default config;
