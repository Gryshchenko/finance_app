import { readFileSync } from 'fs';
import * as process from 'process';

require('dotenv').config();

const caCert = readFileSync('./cert.pem').toString();
interface IConfig {
    appName: string | undefined;
    appPort: number | undefined;
    dbName: string | undefined;
    dbUser: string | undefined;
    dbPass: string | undefined;
    dbPort: string | undefined;
    dbHost: string | undefined;
    dbCACert: string | undefined;
    ssSecret: string | undefined;
    ssName: string | undefined;
    jwtSecret: string | undefined;
    jwtIssuer: string | undefined;
    jwtAudience: string | undefined;
    redisHost: string | undefined;
    redisPort: string | undefined;
    mailNotReply: string | undefined;
}

export function getConfig(): IConfig {
    const config = {
        appName: process.env.TEST_APP_NAME ?? process.env.APP_NAME,
        appPort: Number(process.env.TEST_PORT ?? process.env.PORT),
        dbName: process.env.TEST_DB_NAME ?? process.env.DB_NAME,
        dbUser: process.env.TEST_DB_USER ?? process.env.DB_USER,
        dbPass: process.env.TEST_DB_PASS ?? process.env.DB_PASS,
        dbPort: process.env.TEST_DB_PORT ?? process.env.DB_PORT,
        dbHost: process.env.TEST_DB_HOST ?? process.env.DB_HOST,
        dbCACert: caCert,
        ssSecret: process.env.TEST_SS_SECRET ?? process.env.SS_SECRET,
        ssName: process.env.TEST_SS_NAME ?? process.env.SS_NAME,
        jwtSecret: process.env.TEST_JWT_SECRET ?? process.env.JWT_SECRET,
        jwtIssuer: process.env.TEST_JWT_ISSUER ?? process.env.JWT_ISSUER,
        jwtAudience: process.env.TEST_JWT_AUDIENCE ?? process.env.JWT_AUDIENCE,
        redisHost: process.env.TEST_REDIS_HOST ?? process.env.REDIS_HOST,
        redisPort: process.env.TEST_REDIS_PORT ?? process.env.REDIS_PORT,
        mailNotReply: undefined,
    };

    return config;
}
