export default () => ({
    port: parseInt(process.env.PORT, 10) || 3010,
    database: {
        uri: process.env.MONGODB_URI, // Query: should we use ConfigModule.get<string>('MONGODB_URI') instead of process.env.MONGODB_URI?
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION,
    },
    // ... other configuration mappings ...
});