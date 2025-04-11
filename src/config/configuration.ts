import { EnvValidationSchema, envValidationSchema } from "src/config/validation/env.validation";

// STEP 2
const configuration = () => {
    // TODO: Validate the environment variables
    const validationResult = envValidationSchema.validate(process.env, {
        abortEarly: false,
        allowUnknown: true, // WHY IS THIS NEEDED? Should we only validate the env here and not in the app module?
    });

    if (validationResult.error) {
        throw new Error(`Validation failed: ${validationResult.error.message}`);
    }

    const parsedEnv = validationResult.value! as EnvValidationSchema;

    // TODO: Step 1: Add the validationResult.value.[env-key] to the configuration object and add all the variables to the configuration object
    return ({
        jwt: {
            secret: parsedEnv.JWT_SECRET,
            expiration: parsedEnv.JWT_EXPIRATION,
        },

        app: {
            port: parsedEnv.PORT || 3010,
            nodeEnv: parsedEnv.NODE_ENV,
            payloadSecret: parsedEnv.PAYLOAD_SECRET,
        },

        s3: {
            endpoint: parsedEnv.S3_ENDPOINT,
            bucket: parsedEnv.S3_BUCKET,
            accessKeyId: parsedEnv.S3_ACCESS_KEY_ID,
            secretAccessKey: parsedEnv.S3_SECRET_ACCESS_KEY,
            region: parsedEnv.S3_REGION,
            staticBucketPath: parsedEnv.STATIC_BUCKET_PATH,
        },

        frontend: {
            url: parsedEnv.FRONTEND_URL,
        },

        email: {
            sendgridApiKey: parsedEnv.SENDGRID_API_KEY,
            resendApiKey: parsedEnv.RESEND_API_KEY,
            defaultFromEmail: parsedEnv.DEFAULT_FROM_EMAIL,
        },

        smtp: {
            sesSmtpUsername: parsedEnv.SES_SMTP_USERNAME,
            sesSmtpPassword: parsedEnv.SES_SMTP_PASSWORD,
            smtpHost: parsedEnv.SMTP_HOST,
            smtpPort: parsedEnv.SMTP_PORT,
        },

        aws: {
            accountId: parsedEnv.AWS_ACCOUNT_ID,
            accessKey: parsedEnv.AWS_ACCESS_KEY,
            secretKey: parsedEnv.AWS_SECRET_KEY,
        },

        database: {
            uri: parsedEnv.MONGODB_URI,
        },
    })
};

export type IConfiguration = ReturnType<typeof configuration>;

export default configuration;