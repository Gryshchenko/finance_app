import { ErrorCode, HttpCode, Time, Utils } from 'tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ConfirmationHelper } from 'services/confirmation/ConfirmationHelper';
import { IPasswordChangingDataAccess } from 'services/passwordChanging/PasswordChangingDataAccess';
import { IUserService } from 'services/user/UserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import UserServiceUtils from 'src/services/user/UserServiceUtils';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';

const CHANGE_CODE_EXPIRES_IN: [number, number, number] = [0, 10, 0];

export interface IPasswordChangingService {
    request(userId: number, newPassword: string, password: string): Promise<{ confirmationCode: number; expiresAt: Date }>;
    confirm(userId: number, confirmationCode: number): Promise<boolean>;
    refresh(userId: number, confirmationId: number): Promise<boolean>;
}

export default class PasswordChangingService extends LoggerBase implements IPasswordChangingService {
    private readonly _dataAccess: IPasswordChangingDataAccess;
    private readonly _userService: IUserService;
    private readonly _db: IDatabaseConnection;

    public constructor(dataAccess: IPasswordChangingDataAccess, userService: IUserService, db: IDatabaseConnection) {
        super();
        this._dataAccess = dataAccess;
        this._userService = userService;
        this._db = db;
    }

    public async request(
        userId: number,
        newPassword: string,
        oldPassword: string,
    ): Promise<{ confirmationCode: number; expiresAt: Date }> {
        this._logger.info(`Password change requested for userId ${userId}`);
        const uow = new UnitOfWork(this._db);

        try {
            await uow.start();
            const trxInProcess = uow.getTransaction();
            if (Utils.isNull(trxInProcess)) {
                throw new CustomError({
                    message: 'Transaction not initiated. User could not be created',
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
            const hashOldPasswordFromDB = user.passwordHash;
            const isPasswordSame = await UserServiceUtils.verifyPassword(hashOldPasswordFromDB, oldPassword);
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

            // Hash the password now so we never store plain text.
            // Store both hash and salt so the same pair is applied to users on confirm.
            const saltBuffer = UserServiceUtils.getRandomSalt();
            const passwordHash = (await UserServiceUtils.hashPassword(newPassword, saltBuffer)) as string;
            const salt = saltBuffer.toString('hex');

            await this._dataAccess.create(userId, passwordHash, salt, confirmationCode, expiresAt, trx);

            await uow.commit();
            this._logger.info(`Password change request created for userId ${userId}`);
            return { confirmationCode, expiresAt };
        } catch (e) {
            await uow.rollback();
            this._logger.error(`Password change request failed for userId ${userId}: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    public async confirm(userId: number, confirmationCode: number): Promise<boolean> {
        this._logger.info(`Confirming password change for userId ${userId}`);
        const uow = new UnitOfWork(this._db);
        try {
            await uow.start();
            const trxInProcess = uow.getTransaction();
            if (Utils.isNull(trxInProcess)) {
                throw new CustomError({
                    message: 'Transaction not initiated. User could not be created',
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }
            const trx = trxInProcess as unknown as IDBTransaction;
            const record = await this._dataAccess.getByUserId(userId, Time.getISODateNowUTC());

            if (!record) {
                throw new ValidationError({
                    message: `No pending password change found for userId ${userId}`,
                    errorCode: ErrorCode.AUTH_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                });
            }

            ConfirmationHelper.validateCode(record.confirmationCode, confirmationCode);

            await this._dataAccess.confirm(userId, record.id, trx);
            // Apply the exact hash+salt pair that was stored during request
            await this._userService.updateUserPassword(userId, record.passwordHash, record.salt, trx);

            this._logger.info(`Password change confirmed for userId ${userId}`);
            await uow.commit();
            return true;
        } catch (e) {
            await uow.rollback();
            this._logger.error(`Password change confirmation failed for userId ${userId}: ${(e as { message: string }).message}`);
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
            this._logger.info(`Refresh confirmation code send for userId ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(`Refresh confirmation code failed for userId ${userId}: ${(e as { message: string }).message}`);
            throw e;
        }
    }
}
