import { NextFunction, Request, Response } from 'express';
import { ResponseBuilderPreset } from 'helper/responseBuilder/ResponseBuilderPreset';
import Logger from 'helper/logger/Logger';
import { HttpCode } from 'tenpercent/shared';
import passport from 'passport';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { ResponseStatusType } from 'tenpercent/shared';
import { extractToken } from 'tenpercent/shared';
import TokenBlacklistBuilder from 'services/auth/TokenBlacklistBuilder';
import { ErrorCode } from 'tenpercent/shared';
import jwt, { Algorithm } from 'jsonwebtoken';
import { getConfig } from 'src/config/config';
import { JwtPayloadCustom } from 'services/auth/passport-setup';
import { ValidationError } from 'src/utils/errors/ValidationError';

const _logger = Logger.Of('TokenVerify');

export const tokenLongVerify = (req: Request, res: Response, next: NextFunction) => {
    const buildError = (message: string) => {
        throw new ValidationError({
            message,
            errorCode: ErrorCode.TOKEN_LONG_INVALID_ERROR,
            statusCode: HttpCode.BAD_REQUEST,
        });
    };

    const token = String(req.body?.token);
    try {
        const userId = req.params?.userId;
        if (!token || !userId) {
            buildError(`Token or userID invalid - userID: ${userId}`);
        }
        const payload = jwt.verify(token, getConfig().jwtLongSecret, {
            algorithms: [getConfig().jwtAlgorithm as Algorithm],
            issuer: getConfig().jwtIssuer,
            ignoreExpiration: true,
            audience: getConfig().jwtAudience,
            subject: String(userId),
        }) as JwtPayloadCustom;

        if (payload.sub !== String(userId)) {
            buildError(`Token sub not same as userId`);
        }
        req.user = {
            userId: Number(userId),
        };

        _logger?.info('Token long pass validation');
        return next();
    } catch (e: unknown) {
        const responseBuilder = new ResponseBuilder();
        _logger.error(`Token long failed due reason: ${(e as { message: string }).message}`);
        return res
            .status(HttpCode.BAD_REQUEST)
            .json(
                responseBuilder
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({ errorCode: ErrorCode.TOKEN_LONG_INVALID_ERROR })
                    .build(),
            )
            .end();
    }
};

export const tokenResetVerify = (req: Request, res: Response, next: NextFunction) => {
    const buildError = (message: string) => {
        throw new ValidationError({
            message,
            errorCode: ErrorCode.TOKEN_RESET_INVALID_ERROR,
            statusCode: HttpCode.UNAUTHORIZED,
        });
    };

    const token = extractToken(req.headers.authorization);
    try {
        const userId = req.params?.userId;
        if (!token || typeof token !== 'string' || !userId) {
            buildError(`Reset token or userId invalid - userId: ${userId}`);
        }
        const payload = jwt.verify(token as string, getConfig().jwtResetSecret, {
            algorithms: [getConfig().jwtAlgorithm as Algorithm],
            issuer: getConfig().jwtIssuer,
            audience: getConfig().jwtAudience,
            subject: String(userId),
        }) as JwtPayloadCustom;

        if (payload.sub !== String(userId)) {
            buildError(`Reset token sub not same as userId`);
        }
        req.user = {
            userId: Number(userId),
        };

        _logger.info('Reset token pass validation');
        return next();
    } catch (e: unknown) {
        const responseBuilder = new ResponseBuilder();
        _logger.error(`Reset token failed due reason: ${(e as { message: string }).message}`);
        return res
            .status(HttpCode.UNAUTHORIZED)
            .json(
                responseBuilder
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({ errorCode: ErrorCode.TOKEN_RESET_INVALID_ERROR })
                    .build(),
            )
            .end();
    }
};

export const tokenVerify = async (req: Request, res: Response, next: NextFunction) => {
    const responseBuilder = new ResponseBuilder();

    const token = extractToken(req.headers.authorization);

    if (!token || typeof token !== 'string') {
        _logger.error('No token provided');
        return res.status(HttpCode.UNAUTHORIZED).json(ResponseBuilderPreset.getAuthError());
    }

    const blacklist = TokenBlacklistBuilder.build();
    try {
        if (await blacklist.isBlacklisted(token)) {
            _logger.warn('Token is blacklisted');
            return res
                .status(HttpCode.UNAUTHORIZED)
                .json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({ errorCode: ErrorCode.TOKEN_INVALID_ERROR })
                        .build(),
                );
        }
    } catch (err) {
        _logger.error('Error checking token blacklist', err);
        return res.status(HttpCode.SERVICE_UNAVAILABLE).json(
            responseBuilder
                .setStatus(ResponseStatusType.INTERNAL)
                .setError({
                    errorCode: ErrorCode.UNKNOWN_ERROR,
                })
                .build(),
        );
    }
    return passport.authenticate(
        'jwt',
        { session: false },
        (err: unknown, user?: Express.User | false | null, info?: { name: string; message: string }) => {
            if (err) {
                _logger.error('JWT system error', err);
                return res.status(HttpCode.SERVICE_UNAVAILABLE).json(
                    new ResponseBuilder()
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({
                            errorCode: ErrorCode.TOKEN_INVALID_ERROR,
                        })
                        .build(),
                );
            }
            if (!user) {
                let message = 'Unauthorized';
                let obj = null;

                if (info) {
                    if (info.name === 'TokenExpiredError') {
                        message = 'Token expired';
                        obj = ResponseBuilderPreset.getTokenExpired();
                    } else if (info.name === 'JsonWebTokenError') {
                        message = 'Invalid token';
                        obj = ResponseBuilderPreset.getAuthError();
                    } else if (typeof info === 'string') {
                        message = info;
                        obj = ResponseBuilderPreset.getAuthError();
                    } else if (info.message) {
                        obj = ResponseBuilderPreset.getAuthError();
                        message = info.message;
                    }
                }

                _logger.error(`JWT validation failed due reason: ${message}`);
                return res.status(HttpCode.UNAUTHORIZED).json(obj);
            }

            req.user = user;
            _logger.info('Token regular pass validation');
            return next();
        },
    )(req, res, next);
};

export default tokenVerify;
