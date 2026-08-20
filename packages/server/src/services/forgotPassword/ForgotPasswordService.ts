import { ErrorCode, HttpCode, RoleType, Utils } from '@tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import AuthService from 'services/auth/AuthService';
import { ConfirmationHelper } from 'services/confirmation/ConfirmationHelper';
import { IForgotPasswordDataAccess } from 'services/forgotPassword/ForgotPasswordDataAccess';
import { IMailNotificationService } from 'services/notification/MailNotificationService';
import { IUserService } from 'services/user/UserService';
import UserServiceUtils from 'services/user/UserServiceUtils';
import { getConfig } from 'src/config/config';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';

const FORGET_CODE_EXPIRES_IN: [number, number, number] = [0, 10, 0]; // 10 minutes

export interface IForgotPasswordService {
    request(email: string): Promise<void>;
    refresh(email: string): Promise<void>;
    confirm(email: string, confirmationCode: number): Promise<{ resetToken: string }>;
    forgetChange(newPassword: string, userId: number): Promise<boolean>;
}

export default class ForgotPasswordService extends LoggerBase implements IForgotPasswordService {
    private readonly _dataAccess: IForgotPasswordDataAccess;
    private readonly _userService: IUserService;
    private readonly _db: IDatabaseConnection;
    private readonly _mailNotification: IMailNotificationService;

    public constructor(
        dataAccess: IForgotPasswordDataAccess,
        userService: IUserService,
        db: IDatabaseConnection,
        mailNotification: IMailNotificationService,
    ) {
        super();
        this._dataAccess = dataAccess;
        this._userService = userService;
        this._db = db;
        this._mailNotification = mailNotification;
    }

    public async request(email: string): Promise<void> {
        this._logger.info(`Forgot password requested`);
        try {
            const userId = await this._userService.getUserIdByMail(email);
            if (!userId) {
                this._logger.error(`Forgot password: email not found, silently ignoring`);
                return;
            }

            const expiresAt = ConfirmationHelper.createExpiresAt(FORGET_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();

            await this._dataAccess.create(userId, email, confirmationCode, expiresAt);

            await this._mailNotification.sendForgotPasswordCode(
                email,
                confirmationCode,
                ConfirmationHelper.toMinutes(FORGET_CODE_EXPIRES_IN),
            );
            this._logger.info(`Forgot password request stored for userId: ${userId}`);
        } catch (e) {
            this._logger.error(`Forgot password request failed: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    public async refresh(email: string): Promise<void> {
        this._logger.info(`Forgot password refresh requested`);
        try {
            const record = await this._dataAccess.getRecord(email);
            if (!record) {
                this._logger.error(`Forgot password refresh: no active request found, silently ignoring`);
                return;
            }

            const expiresAt = ConfirmationHelper.createExpiresAt(FORGET_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();

            await this._dataAccess.refresh(email, confirmationCode, expiresAt);

            await this._mailNotification.sendForgotPasswordCode(
                email,
                confirmationCode,
                ConfirmationHelper.toMinutes(FORGET_CODE_EXPIRES_IN),
            );
            this._logger.info(`Forgot password code refreshed for userId: ${record.userId}`);
        } catch (e) {
            this._logger.error(`Forgot password refresh failed: ${(e as { message: string }).message}`);
            throw e;
        }
    }
    public async confirm(email: string, confirmationCode: number): Promise<{ resetToken: string; userId: number }> {
        this._logger.info(`Forgot password confirm requested`);
        const uow = new UnitOfWork(this._db);
        let committed = false;
        try {
            await uow.start();
            const trxInProcess = uow.getTransaction();
            if (Utils.isNull(trxInProcess)) {
                throw new CustomError({
                    message: 'Transaction not initiated. Forgot password could not be confirmed',
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }
            const trx = trxInProcess as unknown as IDBTransaction;
            const record = await this._dataAccess.getRecord(email, confirmationCode);

            if (!record) {
                throw new ValidationError({
                    message: 'No active password reset request found or code has expired',
                    errorCode: ErrorCode.FORGOT_PASSWORD_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                });
            }

            ConfirmationHelper.validateCode(record.confirmationCode, confirmationCode);

            await this._dataAccess.confirm(email, record.confirmationCode, trx);
            // Proving control of the mailbox is enough to lock every existing session out, so
            // an attacker holding a stolen token cannot outlive the reset flow.
            await this._userService.revokeAllSessions(record.userId, trx);
            await uow.commit();
            committed = true;

            // Minted after the revocation is committed: its `iat` must not predate the new
            // epoch, otherwise the reset token would be rejected by the token middleware.
            const resetToken = AuthService.createJWToken(
                record.userId,
                RoleType.Default,
                getConfig().jwtResetSecret,
                getConfig().jwtResetExpiresIn,
                'reset',
            );

            this._logger.info(`Forgot password confirmed for userId: ${record.userId}`);
            return { resetToken, userId: record.userId };
        } catch (e) {
            if (!committed) {
                await uow.rollback();
            }
            this._logger.error(`Forgot password confirm failed: ${(e as { message: string }).message}`);
            throw e;
        }
    }
    public async forgetChange(newPassword: string, userId: number): Promise<boolean> {
        this._logger.info(`Forgot password change requested`);
        try {
            const saltBuffer = UserServiceUtils.getRandomSalt();
            const passwordHash = (await UserServiceUtils.hashPassword(newPassword, saltBuffer)) as string;
            const salt = saltBuffer.toString('hex');
            await this._userService.updateUserPassword(userId, passwordHash, salt);
            this._logger.info(`Forgot password change for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(`Forgot password change failed: ${(e as { message: string }).message}`);
            throw e;
        }
    }
}
