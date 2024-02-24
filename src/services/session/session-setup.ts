import * as process from 'process';

require('dotenv').config();
const session = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis').default;
const Logger = require('../../helper/logger/Logger');

module.exports = () => {
    const redisClient = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    });
    redisClient.connect().catch(Logger.Of('Redis').error);

    const redisStore = new RedisStore({
        client: redisClient,
        prefix: 'myapp:',
    });

    redisClient.on('error', (err: string) => {
        Logger.Of('Redis').error('Redis error: ', err);
    });
    redisClient.on('connect', function () {
        Logger.Of('Redis').error('Redis connect');
    });
    return session({
        store: redisStore,
        secret: process.env.SS_SECRET,
        name: process.env.SS_NAME,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true,
            httpOnly: true,
            maxAge: 1000 * 60 * 60,
        },
    });
};
