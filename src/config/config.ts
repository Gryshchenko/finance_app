import { readFileSync } from 'fs';
import * as process from 'process';

require('dotenv').config();

const caCert = readFileSync('./cert.pem').toString();

interface IConfig {
    appName: string;
    appPort: number;
    dbName: string;
    dbUser: string;
    dbPass: string;
    dbPort: string;
    dbHost: string;
    dbCACert: string;
    ssSecret: string;
    ssName: string;
    jwtSecret: string;
    jwtIssuer: string;
    jwtAudience: string;
    redisHost: string;
    redisPort: string;
    mailNotReply: string;
    trustedOrigin: string;
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
        dbCACert: caCert,
        ssSecret: (process.env.TEST_SS_SECRET ?? process.env.SS_SECRET) as string,
        ssName: (process.env.TEST_SS_NAME ?? process.env.SS_NAME) as string,
        jwtSecret: (process.env.TEST_JWT_SECRET ?? process.env.JWT_SECRET) as string,
        jwtIssuer: (process.env.TEST_JWT_ISSUER ?? process.env.JWT_ISSUER) as string,
        jwtAudience: (process.env.TEST_JWT_AUDIENCE ?? process.env.JWT_AUDIENCE) as string,
        redisHost: (process.env.TEST_REDIS_HOST ?? process.env.REDIS_HOST) as string,
        redisPort: (process.env.TEST_REDIS_PORT ?? process.env.REDIS_PORT) as string,
        mailNotReply: 'test',
    };
}
