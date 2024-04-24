import { Request, Response } from 'express';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationKey } from 'types/TranslationKey';
import { IUser } from 'interfaces/IUser';
import { IUserSession } from 'interfaces/IUserSession';
import { RoleType } from 'types/RoleType';
import Logger from 'src/helper/logger/Logger';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';

require('dotenv').config();
const session = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis').default;

export default class SessionService {
    public static deleteSession(req: Request, res: Response, cb: () => void): void {
        const _logger = Logger.Of('deleteSession');
        _logger.info('start session delete procedure');
        req.session.destroy((err) => {
            if (err) {
                _logger.error('delete session error: ' + err);
                const responseBuilder = new ResponseBuilder();
                res.status(400).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({
                            errorCode: ErrorCode.SESSION_DESTROY_ERROR,
                            msg: TranslationKey.SOMETHING_WRONG,
                        })
                        .build(),
                );
            }
            res.clearCookie(process.env.SS_NAME as string, { path: '/' });
            _logger.info('delete session success');
            if (cb) {
                cb();
            }
        });
    }
    private static buildSessionObject(user: IUser, token: string, ip: string, sessionId: string): IUserSession {
        return {
            userId: user.userId,
            sessionId: sessionId,
            premission: RoleType.Default,
            createdate: user.createdAt,
            updatedate: user.updatedAt,
            email: user.email,
            ip,
            token,
        };
    }

    public static regenerateSession({
        req,
        user,
        err,
        handleError,
        handleSuccess,
        token,
    }: {
        req: Request;
        user: IUser;
        token: string;
        err?: string;
        handleError: (err: string) => void;
        handleSuccess: (id: string) => void;
    }): void {
        if (err) {
            handleError(err);
        }
        // @ts-ignore
        req.session.user = SessionService.buildSessionObject(user, token, req.ip || req.connection.remoteAddress, req.sessionID);
        req.session.save((err: string) => {
            if (err) {
                handleError(err);
            } else {
                handleSuccess(req.session.id);
            }
        });
    }
    public static setup(): typeof session {
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
    }

    public static handleSessionRegeneration(
        req: Request,
        res: Response,
        user: IUser,
        token: string,
        logger: Logger,
        responseBuilder: ResponseBuilder,
        handleSuccess: () => void,
        handleError?: (error: string) => void,
    ): void {
        req.session.regenerate((err) => {
            if (err) {
                logger.error('Session regeneration error: ' + err);
                res.status(400).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({ errorCode: ErrorCode.SESSION_CREATE_ERROR, msg: TranslationKey.SESSION_CREATE_ERROR })
                        .build(),
                );
                return;
            }

            SessionService.regenerateSession({
                err,
                user,
                token,
                req,
                handleError: (error: string) => {
                    logger.error('Session regenerate error: ' + error);
                    res.status(400).json(
                        responseBuilder
                            .setStatus(ResponseStatusType.INTERNAL)
                            .setError({ errorCode: ErrorCode.SESSION_CREATE_ERROR, msg: TranslationKey.SESSION_CREATE_ERROR })
                            .build(),
                    );
                    if (handleError) {
                        handleError(error);
                    }
                },
                handleSuccess: (sessionId: string) => {
                    logger.info('Session regenerated successfully: ' + sessionId);
                    res.setHeader('Authorization', `Bearer ${token}`);
                    if (handleSuccess) {
                        handleSuccess();
                    }
                },
            });
        });
    }
}
