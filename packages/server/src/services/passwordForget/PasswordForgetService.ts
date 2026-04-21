import { ErrorCode, HttpCode, RoleType } from 'tenpercent/shared';

import AuthService from 'services/auth/AuthService';
import { ConfirmationHelper } from 'services/confirmation/ConfirmationHelper';
import { IPasswordForgetDataAccess } from 'services/passwordForget/PasswordForgetDataAccess';
import { IUserService } from 'services/user/UserService';
import UserServiceUtils from 'services/user/UserServiceUtils';
import { getConfig } from 'src/config/config';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ValidationError } from 'src/utils/errors/ValidationError';

const FORGET_CODE_EXPIRES_IN: [number, number, number] = [0, 10, 0]; // 10 minutes

export interface IPasswordForgetService {
    request(email: string): Promise<void>;
    refresh(email: string): Promise<void>;
    confirm(email: string, confirmationCode: number): Promise<{ resetToken: string }>;
    forgetChange(newPassword: string, userId: number): Promise<boolean>;
}

export default class PasswordForgetService extends LoggerBase implements IPasswordForgetService {
    private readonly _dataAccess: IPasswordForgetDataAccess;
    private readonly _userService: IUserService;

    public constructor(dataAccess: IPasswordForgetDataAccess, userService: IUserService) {
        super();
        this._dataAccess = dataAccess;
        this._userService = userService;
    }

    public async request(email: string): Promise<void> {
        this._logger.info(`Password forget requested`);
        try {
            const userId = await this._userService.getUserIdByMail(email);
            if (!userId) {
                this._logger.error(`Password forget: email not found, silently ignoring`);
                return;
            }

            const expiresAt = ConfirmationHelper.createExpiresAt(FORGET_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();

            await this._dataAccess.upsert(userId, email, confirmationCode, expiresAt);

            // TODO: send confirmationCode to email via mail service
            this._logger.info(`Password forget request stored for userId: ${userId}`);
        } catch (e) {
            this._logger.error(`Password forget request failed: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    public async refresh(email: string): Promise<void> {
        this._logger.info(`Password forget refresh requested`);
        try {
            const record = await this._dataAccess.getActiveByEmail(email);
            if (!record) {
                this._logger.error(`Password forget refresh: no active request found, silently ignoring`);
                return;
            }

            const expiresAt = ConfirmationHelper.createExpiresAt(FORGET_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();

            await this._dataAccess.refresh(email, confirmationCode, expiresAt);

            // TODO: send new confirmationCode to email via mail service
            this._logger.info(`Password forget code refreshed for userId: ${record.userId}`);
        } catch (e) {
            this._logger.error(`Password forget refresh failed: ${(e as { message: string }).message}`);
            throw e;
        }
    }
    public async confirm(email: string, confirmationCode: number): Promise<{ resetToken: string; userId: number }> {
        this._logger.info(`Password forget confirm requested`);
        try {
            const record = await this._dataAccess.getActiveByEmail(email);

            if (!record) {
                throw new ValidationError({
                    message: 'No active password reset request found or code has expired',
                    errorCode: ErrorCode.FORGOT_PASSWORD_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                });
            }

            ConfirmationHelper.validateCode(record.confirmationCode, confirmationCode);

            await this._dataAccess.confirm(email);

            const resetToken = AuthService.createJWToken(
                record.userId,
                RoleType.Default,
                getConfig().jwtResetSecret,
                getConfig().jwtResetExpiresIn,
                'reset',
            );

            this._logger.info(`Password forget confirmed for userId: ${record.userId}`);
            return { resetToken, userId: record.userId };
        } catch (e) {
            this._logger.error(`Password forget confirm failed: ${(e as { message: string }).message}`);
            throw e;
        }
    }
    public async forgetChange(newPassword: string, userId: number): Promise<boolean> {
        this._logger.info(`Password forge change requested`);
        try {
            const saltBuffer = UserServiceUtils.getRandomSalt();
            const passwordHash = (await UserServiceUtils.hashPassword(newPassword, saltBuffer)) as string;
            const salt = saltBuffer.toString('hex');
            await this._userService.updateUserPassword(userId, passwordHash, salt);
            this._logger.info(`Password forget change for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(`Password forget change failed: ${(e as { message: string }).message}`);
            throw e;
        }
    }
}
