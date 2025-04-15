import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    // MongoDB
    MONGODB_URI: Joi.string().required().uri(),

    // JWT
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRATION: Joi.string().required(),

    // App Settings
    PORT: Joi.number().default(3010),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PAYLOAD_SECRET: Joi.string().required(),

    // S3 Configuration
    S3_ENDPOINT: Joi.string().required().uri(),
    S3_BUCKET: Joi.string().required(),
    S3_ACCESS_KEY_ID: Joi.string().required(),
    S3_SECRET_ACCESS_KEY: Joi.string().required(),
    S3_REGION: Joi.string().required(),
    STATIC_BUCKET_PATH: Joi.string().required().uri(),

    // Frontend
    FRONTEND_URL: Joi.string().required().uri(),

    // Email Configuration
    SENDGRID_API_KEY: Joi.string().required(),
    RESEND_API_KEY: Joi.string().required(),
    DEFAULT_FROM_EMAIL: Joi.string().required().email(),

    // SMTP Configuration
    SES_SMTP_USERNAME: Joi.string().required(),
    SES_SMTP_PASSWORD: Joi.string().required(),
    SMTP_HOST: Joi.string().required(),
    SMTP_PORT: Joi.number().required(),

    // AWS Configuration
    AWS_ACCOUNT_ID: Joi.string().required(),
    AWS_ACCESS_KEY: Joi.string().required(),
    AWS_SECRET_KEY: Joi.string().required(),
});