import { HttpCode, ResponseStatusType, extractToken, ErrorCode } from '@tenpercent/shared';
import { NextFunction, Request, Response } from 'express';
import jwt, { Algorithm } from 'jsonwebtoken';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { JwtPayloadCustom, TokenPurpose } from 'services/auth/passport-setup';
import TokenBlacklistBuilder from 'services/auth/TokenBlacklistBuilder';
import { getConfig } from 'src/config/config';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';
import { ValidationError } from 'src/utils/errors/ValidationError';

const _logger = Logger.Of('TokenVerify');

interface TokenMiddlewareOptions {
    secret: () => string;
    purpose: TokenPurpose;
    errorCode: ErrorCode;
    statusCode: HttpCode;
    extractToken: (req: Request) => string | null | undefined;
    ignoreExpiration?: boolean;
    checkBlacklist?: boolean;
    lookupUser?: boolean;
}

function createTokenMiddleware(options: TokenMiddlewareOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const responseBuilder = new ResponseBuilder();
        const token = options.extractToken(req);

        if (!token || typeof token !== 'string') {
            _logger.error(`Token not provided or invalid`);
            return res
                .status(options.statusCode)
                .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: options.errorCode }).build())
                .end();
        }

        try {
            if (options.checkBlacklist) {
                const blacklist = TokenBlacklistBuilder.build();
                if (await blacklist.isBlacklisted(token)) {
                    _logger.warn('Token is blacklisted');
                    return res
                        .status(HttpCode.UNAUTHORIZED)
                        .json(
                            responseBuilder
                                .setStatus(ResponseStatusType.INTERNAL)
                                .setError({ errorCode: ErrorCode.TOKEN_INVALID_ERROR })
                                .build(),
                        )
                        .end();
                }
            }

            const userId = req.params?.userId;
            const payload = jwt.verify(token, options.secret(), {
                algorithms: [getConfig().jwtAlgorithm as Algorithm],
                issuer: getConfig().jwtIssuer,
                audience: getConfig().jwtAudience,
                ignoreExpiration: options.ignoreExpiration ?? false,
                ...(userId ? { subject: String(userId) } : {}),
            }) as JwtPayloadCustom;

            if (payload.purpose !== options.purpose) {
                throw new ValidationError({
                    message: `Token purpose invalid: expected '${options.purpose}'`,
                    errorCode: options.errorCode,
                    statusCode: options.statusCode,
                });
            }

            if (userId && payload.sub !== String(userId)) {
                throw new ValidationError({
                    message: `Token sub does not match userId`,
                    errorCode: options.errorCode,
                    statusCode: options.statusCode,
                });
            }

            if (options.lookupUser) {
                const userService = UserServiceBuilder.build();
                const user = await userService.get(parseInt(payload.sub, 10));
                if (!user?.userId) {
                    _logger.error(`User not found for sub: ${payload.sub}`);
                    return res
                        .status(HttpCode.UNAUTHORIZED)
                        .json(
                            responseBuilder
                                .setStatus(ResponseStatusType.INTERNAL)
                                .setError({ errorCode: ErrorCode.TOKEN_PAYLOAD_ERROR })
                                .build(),
                        )
                        .end();
                }
                req.user = user;
            } else {
                req.user = { userId: Number(payload.sub) };
            }

            _logger.info(`Token '${options.purpose}' passed validation`);
            return next();
        } catch (e: unknown) {
            _logger.error(`Token '${options.purpose}' failed: ${(e as { message: string }).message}`);
            return res
                .status(options.statusCode)
                .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: options.errorCode }).build())
                .end();
        }
    };
}

export const tokenVerify = createTokenMiddleware({
    secret: () => getConfig().jwtSecret,
    purpose: 'access',
    errorCode: ErrorCode.TOKEN_INVALID_ERROR,
    statusCode: HttpCode.UNAUTHORIZED,
    extractToken: (req) => extractToken(req.headers.authorization),
    ignoreExpiration: false,
    checkBlacklist: true,
    lookupUser: true,
});

export const tokenLongVerify = createTokenMiddleware({
    secret: () => getConfig().jwtLongSecret,
    purpose: 'refresh',
    errorCode: ErrorCode.TOKEN_LONG_INVALID_ERROR,
    statusCode: HttpCode.BAD_REQUEST,
    extractToken: (req) => req.body?.token,
    ignoreExpiration: false,
    checkBlacklist: true,
    lookupUser: true,
});

export const tokenResetVerify = createTokenMiddleware({
    secret: () => getConfig().jwtResetSecret,
    purpose: 'reset',
    errorCode: ErrorCode.TOKEN_RESET_INVALID_ERROR,
    statusCode: HttpCode.UNAUTHORIZED,
    extractToken: (req) => extractToken(req.headers.authorization),
    ignoreExpiration: false,
    checkBlacklist: true,
    lookupUser: false,
});

export default tokenVerify;

export const tokenValidation = ({
    token,
    userId,
    purpose,
    strategy,
}: {
    strategy: 'regular' | 'long' | 'reset';
    token: string;
    userId: number;
    purpose: TokenPurpose[];
}): boolean => {
    try {
        let secret: string;
        switch (strategy) {
            case 'regular':
                secret = getConfig().jwtSecret;
                break;
            case 'long':
                secret = getConfig().jwtLongSecret;
                break;
            case 'reset':
                secret = getConfig().jwtResetSecret;
                break;
            default: {
                throw new Error(`Invalid strategy: ${strategy}`);
            }
        }
        const payload = jwt.verify(token, secret, {
            algorithms: [getConfig().jwtAlgorithm as Algorithm],
            issuer: getConfig().jwtIssuer,
            audience: getConfig().jwtAudience,
            subject: String(userId),
        }) as JwtPayloadCustom;
        if (!payload.purpose) {
            Logger.Of('TokenValidation').warn(`Refresh token not revoked: purpose is missing`);
            return false;
        }
        return purpose.includes(payload.purpose) && payload.sub === String(userId);
    } catch (e) {
        Logger.Of('TokenValidation').warn(`Refresh token not revoked: ${(e as Error).message}`);
        return false;
    }
};
