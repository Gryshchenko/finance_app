// import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import * as process from 'process';

dotenv.config();

// const caCert = readFileSync('./src/certs/cert.pem').toString();

interface IConfig {
    appName: string;
    appPort: number;
    dbName: string;
    dbUser: string;
    dbPass: string;
    dbPort: string;
    dbHost: string;
    // dbCACert: string;
    jwtSecret: string;
    jwtLongSecret: string;
    jwtIssuer: string;
    jwtAudience: string;
    jwtAlgorithm: string;
    jwtExpiresIn: string;
    jwtLongExpiresIn: string;
    // Short-lived token used exclusively for the password-reset flow.
    // Must differ from jwtSecret so the reset token cannot be used as a regular session token.
    jwtResetSecret: string;
    jwtResetExpiresIn: string;
    redisHost: string;
    redisPort: string;
    redisPassword: string;
    redisUsername: string;
    redisPrefix: string;
    mailNotReply: string;
    trustedOrigin: string;
    rateProviderAPI: string;
    rateProviderUrl: string;
}

export function getConfig(): IConfig {
    return {
        trustedOrigin: process.env.ORIGIN as string,
        appName: (process.env.TEST_APP_NAME ?? process.env.APP_NAME) as string,
        appPort: Number(process.env.TEST_PORT ?? process.env.PORT),
        dbName: (process.env.TEST_DB_NAME ?? process.env.DB_NAME) as string,
        dbUser: (process.env.TEST_DB_USER ?? process.env.DB_USER) as string,
        dbPass: (process.env.TEST_DB_PASS ?? process.env.DB_PASS) as string,
        dbPort: (process.env.TEST_DB_PORT ?? process.env.DB_PORT) as string,
        dbHost: (process.env.TEST_DB_HOST ?? process.env.DB_HOST) as string,
        // dbCACert: caCert,
        jwtLongExpiresIn: (process.env.TEST_JWT_LONG_EXPIRES_IN ?? process.env.JWT_LONG_EXPIRES_IN) as string,
        jwtLongSecret: (process.env.TEST_JWT_LONG_SECRET ?? process.env.JWT_LONG_SECRET) as string,
        jwtSecret: (process.env.TEST_JWT_SECRET ?? process.env.JWT_SECRET) as string,
        jwtIssuer: (process.env.TEST_JWT_ISSUER ?? process.env.JWT_ISSUER) as string,
        jwtAudience: (process.env.TEST_JWT_AUDIENCE ?? process.env.JWT_AUDIENCE) as string,
        jwtAlgorithm: (process.env.TEST_JWT_ALGORITHM ?? process.env.JWT_ALGORITHM) as string,
        jwtExpiresIn: (process.env.TEST_JWT_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN) as string,
        jwtResetSecret: (process.env.TEST_JWT_RESET_SECRET ?? process.env.JWT_RESET_SECRET) as string,
        jwtResetExpiresIn: process.env.TEST_JWT_RESET_EXPIRES_IN ?? process.env.JWT_RESET_EXPIRES_IN ?? '15m',
        redisHost: (process.env.TEST_REDIS_HOST ?? process.env.REDIS_HOST) as string,
        redisPort: (process.env.TEST_REDIS_PORT ?? process.env.REDIS_PORT) as string,
        redisPassword: (process.env.TEST_REDIS_PASSWORD ?? process.env.REDIS_PASSWORD) as string,
        redisUsername: (process.env.TEST_REDIS_USERNAME ?? process.env.REDIS_USERNAME) as string,
        redisPrefix: (process.env.TEST_REDIS_PREFIX ?? process.env.REDIS_PREFIX) as string,
        rateProviderAPI: (process.env.TEST_RATE_PROVIDER_API ?? process.env.RATE_PROVIDER_API) as string,
        rateProviderUrl: (process.env.TEST_RATE_PROVIDER_URL ?? process.env.RATE_PROVIDER_URL) as string,
        mailNotReply: 'test',
    };
}
