import { ErrorCode, HttpCode, Time, Utils } from '@tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IPasswordChanging } from 'interfaces/IPasswordChanging';
import { ConfirmationHelper } from 'services/confirmation/ConfirmationHelper';
import { IMailNotificationService } from 'services/notification/MailNotificationService';
import { IPasswordChangingDataAccess } from 'services/passwordChanging/PasswordChangingDataAccess';
import { IUserService } from 'services/user/UserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import UserServiceUtils from 'src/services/user/UserServiceUtils';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';

const CHANGE_CODE_EXPIRES_IN: [number, number, number] = [0, 10, 0];

/**
 * Password change in three steps: `request` proves the current password and mails a code,
 * `verifyCode` reports whether the code is right, `apply` takes the new password and commits.
 *
 * The new password is never stored. It arrives only on `apply`, together with the code, so a
 * pending row grants nothing on its own - the row is a proof that the mailbox was reached, not
 * an instruction to set a particular password. That is what stops an abandoned request from
 * later overwriting a password the user has since changed by another route.
 *
 * `verifyCode` exists purely so the client can tell the user the code is wrong before asking
 * them to think up a password. It changes nothing, and the code it checks is checked again on
 * `apply` - that second check is the one that matters.
 */
export interface IPasswordChangingService {
    request(userId: number, password: string): Promise<{ confirmationCode: number; expiresAt: Date }>;
    verifyCode(userId: number, confirmationCode: number): Promise<boolean>;
    apply(userId: number, confirmationCode: number, newPassword: string): Promise<boolean>;
    refresh(userId: number, confirmationId: number): Promise<boolean>;
}

export default class PasswordChangingService extends LoggerBase implements IPasswordChangingService {
    private readonly _dataAccess: IPasswordChangingDataAccess;
    private readonly _userService: IUserService;
    private readonly _db: IDatabaseConnection;
    private readonly _mailNotification: IMailNotificationService;

    public constructor(
        dataAccess: IPasswordChangingDataAccess,
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

    /**
     * The active request for a user: unconfirmed and not yet expired. Anything older is dead
     * weight, and `request` reuses this row rather than adding a second one, so at most one
     * code is live at a time.
     */
    private async getActiveRequest(userId: number): Promise<IPasswordChanging | undefined> {
        return await this._dataAccess.getByUserId(userId, Time.getISODateNowUTC());
    }

    private noActiveRequestError(userId: number): ValidationError {
        return new ValidationError({
            message: `No pending password change found for userId ${userId}`,
            errorCode: ErrorCode.PROFILE_PASSWORD_VERIFICATION_CODE_EXPIRED_ERROR,
            statusCode: HttpCode.BAD_REQUEST,
            payload: { field: 'confirmationCode', reason: 'validation:codeExpired' },
        });
    }

    public async request(userId: number, password: string): Promise<{ confirmationCode: number; expiresAt: Date }> {
        this._logger.info(`Password change requested for userId ${userId}`);
        const uow = new UnitOfWork(this._db);

        try {
            await uow.start();
            const trxInProcess = uow.getTransaction();
            if (Utils.isNull(trxInProcess)) {
                throw new CustomError({
                    message: 'Transaction not initiated. Password change could not be requested',
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }
            const trx = trxInProcess as unknown as IDBTransaction;
            const user = await this._userService.getUserAuthenticationDataById(userId, trx);
            if (!user) {
                throw new ValidationError({
                    message: `No user found for userId ${userId}`,
                    errorCode: ErrorCode.AUTH_ERROR,
                    statusCode: HttpCode.NOT_FOUND,
                });
            }
            const isPasswordSame = await UserServiceUtils.verifyPassword(user.passwordHash, password);
            if (!isPasswordSame) {
                throw new ValidationError({
                    message: 'Password compare failed',
                    errorCode: ErrorCode.PASSWORD_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                    payload: { field: 'password', reason: 'validation:passwordWrong' },
                });
            }

            const expiresAt = ConfirmationHelper.createExpiresAt(CHANGE_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();

            // One live code per user: an existing request is re-dated and re-coded rather than
            // joined by a second row, so the code from an earlier mail stops working the moment
            // a new one is sent.
            const existing = await this.getActiveRequest(userId);
            if (existing) {
                await this._dataAccess.refresh(userId, existing.id, confirmationCode, expiresAt);
            } else {
                await this._dataAccess.create(userId, confirmationCode, expiresAt, trx);
            }

            await uow.commit();
            await this._mailNotification.sendPasswordChangeConfirmation(
                user.email,
                confirmationCode,
                ConfirmationHelper.toMinutes(CHANGE_CODE_EXPIRES_IN),
            );
            this._logger.info(`Password change request created for userId ${userId}`);
            return { confirmationCode, expiresAt };
        } catch (e) {
            await uow.rollback();
            this._logger.error(`Password change request failed for userId ${userId}: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    /** Read-only: tells the client whether the code is right, without spending it. */
    public async verifyCode(userId: number, confirmationCode: number): Promise<boolean> {
        this._logger.info(`Verifying password change code for userId ${userId}`);
        try {
            const record = await this.getActiveRequest(userId);
            if (!record) {
                throw this.noActiveRequestError(userId);
            }

            ConfirmationHelper.validateCode(record.confirmationCode, confirmationCode);

            this._logger.info(`Password change code verified for userId ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Password change code verification failed for userId ${userId}: ${(e as { message: string }).message}`,
            );
            throw e;
        }
    }

    public async apply(userId: number, confirmationCode: number, newPassword: string): Promise<boolean> {
        this._logger.info(`Applying password change for userId ${userId}`);
        const uow = new UnitOfWork(this._db);
        try {
            await uow.start();
            const trxInProcess = uow.getTransaction();
            if (Utils.isNull(trxInProcess)) {
                throw new CustomError({
                    message: 'Transaction not initiated. Password change could not be applied',
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }
            const trx = trxInProcess as unknown as IDBTransaction;

            const record = await this.getActiveRequest(userId);
            if (!record) {
                throw this.noActiveRequestError(userId);
            }

            ConfirmationHelper.validateCode(record.confirmationCode, confirmationCode);

            const user = await this._userService.getUserAuthenticationDataById(userId, trx);
            if (!user) {
                throw new ValidationError({
                    message: `No user found for userId ${userId}`,
                    errorCode: ErrorCode.AUTH_ERROR,
                    statusCode: HttpCode.NOT_FOUND,
                });
            }

            // Reusing the current password would revoke every session for no gain, so it is
            // refused here rather than silently accepted. The stored hash answers this without
            // the client having to send the old password again.
            const isSameAsCurrent = await UserServiceUtils.verifyPassword(user.passwordHash, newPassword);
            if (isSameAsCurrent) {
                throw new ValidationError({
                    message: 'New password matches the current one',
                    errorCode: ErrorCode.PASSWORD_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                    payload: { field: 'newPassword', reason: 'validation:passwordSameAsCurrent' },
                });
            }

            const saltBuffer = UserServiceUtils.getRandomSalt();
            const passwordHash = (await UserServiceUtils.hashPassword(newPassword, saltBuffer)) as string;
            const salt = saltBuffer.toString('hex');

            await this._dataAccess.confirm(userId, record.id, trx);
            await this._userService.updateUserPassword(userId, passwordHash, salt, trx);
            // Proving the mailbox is enough to lock every existing session out, so a stolen
            // token cannot outlive the change.
            await this._userService.revokeAllSessions(userId, trx);

            await uow.commit();
            this._logger.info(`Password change applied for userId ${userId}`);
            return true;
        } catch (e) {
            await uow.rollback();
            this._logger.error(`Password change failed for userId ${userId}: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    public async refresh(userId: number, confirmationId: number): Promise<boolean> {
        this._logger.info(`Refresh confirmation code password change for userId ${userId}`);
        try {
            const record = await this._dataAccess.getByUserId(userId, undefined);

            if (!record) {
                throw new ValidationError({
                    message: 'Sending confirmation code failed, code expired',
                    errorCode: ErrorCode.PROFILE_PASSWORD_VERIFICATION_CODE_EXPIRED_ERROR,
                    payload: {
                        field: 'confirmationCode',
                        reason: 'validation:codeExpired',
                    },
                });
            }
            const expiresAt = ConfirmationHelper.createExpiresAt(CHANGE_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();
            await this._dataAccess.refresh(userId, confirmationId, confirmationCode, expiresAt);
            const user = await this._userService.get(userId);
            await this._mailNotification.sendPasswordChangeCodeResend(
                user.email,
                confirmationCode,
                ConfirmationHelper.toMinutes(CHANGE_CODE_EXPIRES_IN),
            );
            this._logger.info(`Refresh confirmation code send for userId ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(`Refresh confirmation code failed for userId ${userId}: ${(e as { message: string }).message}`);
            throw e;
        }
    }
}
