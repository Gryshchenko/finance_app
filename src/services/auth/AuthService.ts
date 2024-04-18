import * as process from 'process';
import { RoleType } from 'types/RoleType';
import { IUserService } from 'interfaces/IUserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IAuthService } from 'interfaces/IAuthService';
import { IUser } from 'interfaces/IUser';
import { ErrorCode } from 'types/ErrorCode';
import { ISuccess } from 'interfaces/ISuccess';
import { IFailure } from 'interfaces/IFailure';

require('dotenv').config();
const Success = require('../../utils/success/Success');
const Failure = require('../../utils/failure/Failure');
const UserServiceUtils = require('../user/UserServiceUtils');
const jwt = require('jsonwebtoken');

export default class AuthService extends LoggerBase implements IAuthService {
    protected userService: IUserService;
    constructor(services: { userService: IUserService }) {
        super();
        this.userService = services.userService;
    }

    async login(email: string, password: string): Promise<ISuccess<{ user: IUser; token: string }> | IFailure> {
        const user = await this.userService.getUser(email, password);
        if (!user) {
            return new Failure('response user data: credential error', ErrorCode.CREDENTIALS_ERROR);
        }
        this._logger.info('response user data userID: ' + user?.userId);
        const hashPassword = UserServiceUtils.hashPassword(password, user.salt);
        if (hashPassword !== user.passwordHash) {
            return new Failure('password not match', ErrorCode.CREDENTIALS_ERROR);
        }
        this._logger.info('password good');
        const newToken = AuthService.createJWToken(String(user.userId), RoleType.Default);
        return new Success({ user, token: newToken });
    }

    public static createJWToken(userId: string, role: RoleType): string {
        return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
            expiresIn: '12h',
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE,
        });
    }
    public static tokenNeedsRefresh(expirationTime: number) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = expirationTime - currentTime;
        return timeLeft < 10 * 60;
    }
}
