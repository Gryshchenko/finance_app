import jwt, { Algorithm, DecodeOptions, JwtPayload } from 'jsonwebtoken';
import { RoleType, ErrorCode, HttpCode, Time, Utils } from 'tenpercent/shared';

import { IUser } from 'interfaces/IUser';
import { JwtPayloadCustom } from 'services/auth/passport-setup';
import TokenBlacklistBuilder from 'services/auth/TokenBlacklistBuilder';
import { IUserService } from 'services/user/UserService';
import { getConfig } from 'src/config/config';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IKeyValueStore } from 'src/repositories/keyValueStore/KeyValueStore';
import UserServiceUtils from 'src/services/user/UserServiceUtils';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';

export interface IAuthService {
    login(email: string, password: string): Promise<{ user: IUser; token: string }>;
}

export default class AuthService extends LoggerBase implements IAuthService {
    protected userService: IUserService;

    constructor(services: { userService: IUserService; keyValueStore: IKeyValueStore }) {
        super();
        this.userService = services.userService;
    }
    async refresh(token: string | undefined, userId: number | undefined, role: RoleType): Promise<string> {
        const throwError = (message: string) => {
            throw new CustomError({
                message,
                statusCode: HttpCode.BAD_REQUEST,
                errorCode: ErrorCode.TOKEN_INVALID_ERROR,
            });
        };
        if (Utils.isEmpty(token as string)) {
            throwError('Token empty');
        }
        if (!userId || !role) {
            throwError(`userId: ${userId} or role: ${role} - empty`);
        }
        const decoded = AuthService.decode(jwt.decode, token as string);
        if (!decoded?.exp) {
            throwError('Token has no expiration');
        }
        return AuthService.createJWToken(userId as number, role, getConfig().jwtSecret, getConfig().jwtExpiresIn);
    }
    async logout(token: string): Promise<void> {
        const decoded = AuthService.decode(jwt.decode, token);
        if (!decoded?.exp) {
            throw new CustomError({
                message: 'Token has no expiration',
                statusCode: HttpCode.BAD_REQUEST,
                errorCode: ErrorCode.TOKEN_EXPIRED_ERROR,
            });
        }
        const nowSec = Time.getSeconds();
        if (decoded.exp > nowSec) {
            await TokenBlacklistBuilder.build().blacklistToken(token);
        }
    }

    async login(email: string, password: string): Promise<{ user: IUser; token: string; longToken: string }> {
        try {
            const userForCheck = await this.userService.getUserAuthenticationData(email);
            if (!userForCheck) {
                throw new ValidationError({
                    message: 'User not found or invalid credentials provided',
                    errorCode: ErrorCode.AUTH_ERROR,
                });
            }

            this._logger.info(`User found: userID ${userForCheck.userId}`);

            await UserServiceUtils.verifyPassword(userForCheck.passwordHash, password);

            this._logger.info('Password verification successful');

            const user = await this.userService.get(userForCheck.userId);
            const token = AuthService.createJWToken(
                user.userId,
                RoleType.Default,
                getConfig().jwtSecret,
                getConfig().jwtExpiresIn,
            );
            const longToken = AuthService.createJWToken(
                user.userId,
                RoleType.Default,
                getConfig().jwtLongSecret,
                getConfig().jwtLongExpiresIn,
            );
            return { user, token, longToken };
        } catch (e) {
            this._logger.info(`Password verification failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }
    public static createJWToken(userId: number, role: RoleType, jwtSecret: string, expiresIn: string): string {
        if (!jwtSecret) {
            throw new CustomError({
                message: 'JWT secret is not configured',
                errorCode: ErrorCode.AUTH_ERROR,
                statusCode: HttpCode.INTERNAL_SERVER_ERROR,
            });
        }

        return jwt.sign({ userId, role }, jwtSecret, {
            algorithm: getConfig().jwtAlgorithm as unknown as Algorithm,
            expiresIn,
            issuer: getConfig().jwtIssuer,
            audience: getConfig().jwtAudience,
            subject: String(userId),
        });
    }

    public static decode(
        decodeImpl: (token: string, options?: DecodeOptions) => null | JwtPayload | string,
        token: string,
    ): JwtPayloadCustom | null {
        if (!token) return null;

        const decoded = decodeImpl(token) as JwtPayloadCustom | null;

        if (!decoded || typeof decoded !== 'object') return null;

        if (!decoded.sub) return null;

        return decoded;
    }
}
