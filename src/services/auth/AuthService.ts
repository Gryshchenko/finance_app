import { RoleType } from 'types/RoleType';
import { IUserService } from 'interfaces/IUserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IAuthService } from 'interfaces/IAuthService';
import { IUser } from 'interfaces/IUser';
import { ErrorCode } from 'types/ErrorCode';
import { ISuccess } from 'interfaces/ISuccess';
import { IFailure } from 'interfaces/IFailure';
import Failure from 'src/utils/failure/Failure';
import Success from 'src/utils/success/Success';
import UserServiceUtils from 'src/services/user/UserServiceUtils';
import { getConfig } from 'src/config/config';
import Utils from 'src/utils/Utils';

const jwt = require('jsonwebtoken');

export default class AuthService extends LoggerBase implements IAuthService {
    protected userService: IUserService;

    constructor(services: { userService: IUserService }) {
        super();
        this.userService = services.userService;
    }

    async login(email: string, password: string): Promise<ISuccess<{ user: IUser; token: string }> | IFailure> {
        const userForCheck = await this.userService.getUserAuthenticationData(email);
        if (!userForCheck) {
            return new Failure('response user data: credential error', ErrorCode.CREDENTIALS_ERROR);
        }
        this._logger.info(`response user data userID: ${userForCheck?.userId}`);
        const result = await UserServiceUtils.verifyPassword(userForCheck.passwordHash, password);
        if (result instanceof Failure) {
            return new Failure(result.error ?? 'password not match', ErrorCode.CREDENTIALS_ERROR);
        }
        if (result instanceof Success && result.value === false) {
            return new Failure('password not match', ErrorCode.CREDENTIALS_ERROR);
        }
        this._logger.info('password good');
        const user = await this.userService.getUser(userForCheck.userId);
        const newToken = AuthService.createJWToken(user.userId, RoleType.Default);
        return new Success({ user, token: newToken });
    }

    public static createJWToken(userId: number, role: RoleType): string {
        const jwtSecretInProcess = getConfig().jwtSecret;
        if (Utils.isEmpty(jwtSecretInProcess)) {
            throw new Error('jwt secret not setup');
        }
        const jwtSecret = jwtSecretInProcess as unknown as string;
        return jwt.sign({ userId, role }, jwtSecret, {
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
