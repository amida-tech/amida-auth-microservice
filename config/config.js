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
    JWT_SECRET: Joi.string().required()
        .description('JWT Secret required to sign'),
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
    MAILER_EMAIL_ID: Joi.string().allow(''),
    MAILER_PASSWORD: Joi.string().allow(''),
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
}).unknown()
    .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    jwtSecret: envVars.JWT_SECRET,
    postgres: {
        db: envVars.PG_DB,
        port: envVars.PG_PORT,
        host: envVars.PG_HOST,
        user: envVars.PG_USER,
        passwd: envVars.PG_PASSWD,
    },
    mailer: {
        user: envVars.MAILER_EMAIL_ID,
        password: envVars.MAILER_PASSWORD,
        service: envVars.MAILER_SERVICE_PROVIDER,
    },
};

export default config;
