import { RoleType } from 'types/RoleType';
import { IUserService } from 'interfaces/IUserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IAuthService } from 'interfaces/IAuthService';
import { IUser } from 'interfaces/IUser';
import { ErrorCode } from 'types/ErrorCode';
import UserServiceUtils from 'src/services/user/UserServiceUtils';
import { getConfig } from 'src/config/config';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { CustomError } from 'src/utils/errors/CustomError';
import { HttpCode } from 'types/HttpCode';

const jwt = require('jsonwebtoken');

export default class AuthService extends LoggerBase implements IAuthService {
    protected userService: IUserService;

    constructor(services: { userService: IUserService }) {
        super();
        this.userService = services.userService;
    }

    async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
        try {
            const userForCheck = await this.userService.getUserAuthenticationData(email);
            if (!userForCheck) {
                throw new ValidationError({
                    message: 'User not found or invalid credentials provided',
                    errorCode: ErrorCode.AUTH,
                });
            }

            this._logger.info(`User found: userID ${userForCheck.userId}`);

            await UserServiceUtils.verifyPassword(userForCheck.passwordHash, password);

            this._logger.info('Password verification successful');

            const user = await this.userService.getUser(userForCheck.userId);
            const token = AuthService.createJWToken(user.userId, RoleType.Default);
            return { user, token };
        } catch (e) {
            this._logger.info(`Password verification failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    public static createJWToken(userId: number, role: RoleType): string {
        const jwtSecret = getConfig().jwtSecret;
        if (!jwtSecret) {
            throw new CustomError({
                message: 'JWT secret is not configured',
                errorCode: ErrorCode.AUTH,
                statusCode: HttpCode.INTERNAL_SERVER_ERROR,
            });
        }

        return jwt.sign({ userId, role }, jwtSecret as string, {
            expiresIn: '12h',
            issuer: getConfig().jwtIssuer,
            audience: getConfig().jwtAudience,
        });
    }

    public static tokenNeedsRefresh(expirationTime: number) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = expirationTime - currentTime;
        return timeLeft < 10 * 60;
    }
}
