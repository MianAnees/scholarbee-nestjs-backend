import * as Joi from 'joi';

export interface EnvValidationSchema {
    // ELASTICSEARCH
    ELASTICSEARCH_URL: string;
    ELASTICSEARCH_USERNAME: string;
    ELASTICSEARCH_PASSWORD: string;
    ELASTICSEARCH_API_KEY: string;

    // JWT
    JWT_SECRET: string;
    JWT_EXPIRATION: string;

    LOGIN_JWT_SECRET: string;
    LOGIN_JWT_EXPIRATION_SEC: number;

    REFRESH_JWT_SECRET: string;
    REFRESH_JWT_EXPIRATION_SEC: number;

    // App Settings
    PORT: number;
    NODE_ENV: string;
    PAYLOAD_SECRET: string;

    // S3 Configuration
    S3_ENDPOINT: string;
    S3_BUCKET: string;
    S3_ACCESS_KEY_ID: string;
    S3_SECRET_ACCESS_KEY: string;
    S3_REGION: string;
    STATIC_BUCKET_PATH: string;

    // Frontend
    FRONTEND_URL: string;

    // Email Configuration
    SENDGRID_API_KEY?: string;
    RESEND_API_KEY: string;
    DEFAULT_FROM_EMAIL?: string;

    // SMTP Configuration
    SES_SMTP_USERNAME: string;
    SES_SMTP_PASSWORD: string;
    SMTP_HOST: string;
    SMTP_PORT: number;

    // AWS Configuration
    AWS_ACCOUNT_ID: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRET_KEY: string;

    // Database
    DATABASE_HOST?: string;
    DATABASE_PORT?: number;
    DATABASE_USERNAME?: string;
    DATABASE_PASSWORD?: string;
    DATABASE_NAME?: string;
    DATABASE_URI: string;

    // MongoDB
    MONGODB_URI: string;
}
// Config validation error: "SENDGRID_API_KEY" is required. 

// "DEFAULT_FROM_EMAIL" is required.
// "AWS_ACCOUNT_ID" is required. 
// "AWS_ACCESS_KEY" is required. 
// "AWS_SECRET_KEY" is required


export const envValidationSchema = Joi.object<EnvValidationSchema>({

    // ELASTICSEARCH
    ELASTICSEARCH_URL: Joi.string().required().uri(),
    ELASTICSEARCH_USERNAME: Joi.string().required(),
    ELASTICSEARCH_PASSWORD: Joi.string().required(),
    ELASTICSEARCH_API_KEY: Joi.string().required(),

    // JWT
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRATION: Joi.string().required(),

    LOGIN_JWT_SECRET: Joi.string().required(),
    LOGIN_JWT_EXPIRATION_SEC: Joi.number().required(),

    REFRESH_JWT_SECRET: Joi.string().required(),
    REFRESH_JWT_EXPIRATION_SEC: Joi.number().required(),

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
    SENDGRID_API_KEY: Joi.string().optional(),
    RESEND_API_KEY: Joi.string().required(),
    DEFAULT_FROM_EMAIL: Joi.string().optional().email(),

    // SMTP Configuration
    SES_SMTP_USERNAME: Joi.string().required(),
    SES_SMTP_PASSWORD: Joi.string().required(),
    SMTP_HOST: Joi.string().required(),
    SMTP_PORT: Joi.number().required(),

    // AWS Configuration
    AWS_ACCOUNT_ID: Joi.string().required(),
    AWS_ACCESS_KEY: Joi.string().required(),
    AWS_SECRET_KEY: Joi.string().required(),

    // Database (Optional)
    DATABASE_HOST: Joi.string().optional(),
    DATABASE_PORT: Joi.number().default(5432).optional(),
    DATABASE_USERNAME: Joi.string().optional(),
    DATABASE_PASSWORD: Joi.string().optional(),
    DATABASE_NAME: Joi.string().optional(),

    // MongoDB
    MONGODB_URI: Joi.string().required().uri(),
});