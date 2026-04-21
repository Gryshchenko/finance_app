import { ErrorCode, HttpCode, Time } from 'tenpercent/shared';

import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ConfirmationHelper } from 'services/confirmation/ConfirmationHelper';
import { IEmailChangingDataAccess } from 'services/emailChanging/EmailChangingDataAccess';
import { IUserService } from 'services/user/UserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ValidationError } from 'src/utils/errors/ValidationError';

const CHANGE_CODE_EXPIRES_IN: [number, number, number] = [0, 10, 0];

export interface IEmailChangingService {
    request(
        userId: number,
        newEmail: string,
        trx?: IDBTransaction,
    ): Promise<{ confirmationCode: number; expiresAt: Date; id: number }>;
    confirm(userId: number, email: string, confirmationCode: number, trx?: IDBTransaction): Promise<boolean>;
    refresh(userId: number, email: string): Promise<boolean>;
}

export default class EmailChangingService extends LoggerBase implements IEmailChangingService {
    private readonly _dataAccess: IEmailChangingDataAccess;
    private readonly _userService: IUserService;

    public constructor(dataAccess: IEmailChangingDataAccess, userService: IUserService) {
        super();
        this._dataAccess = dataAccess;
        this._userService = userService;
    }

    public async request(userId: number, email: string): Promise<{ confirmationCode: number; expiresAt: Date; id: number }> {
        this._logger.info(`Email change requested for userId ${userId}`);
        try {
            const record = await this._dataAccess.getByUserId(userId, email);
            const user = await this._userService.getUserIdByMail(email);
            if (user) {
                throw new ValidationError({
                    message: `Email ${email} is already in use`,
                    errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                    payload: {
                        field: 'email',
                        reason: 'validation:emailAlreadyInUse',
                    },
                });
            }
            const expiresAt = ConfirmationHelper.createExpiresAt(CHANGE_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();
            if (!record) {
                const response = await this._dataAccess.create(userId, email, confirmationCode, expiresAt);
                this._logger.info(`Email change request created for userId ${userId}`);
                return { confirmationCode, expiresAt, id: response.id };
            } else {
                await this._dataAccess.refresh(userId, email, confirmationCode, expiresAt);
                this._logger.info(`Email change request created for userId ${userId}`);
                return { confirmationCode, expiresAt, id: record.id };
            }
        } catch (e) {
            this._logger.error(`Email change request failed for userId ${userId}: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    public async confirm(userId: number, email: string, confirmationCode: number, trx?: IDBTransaction): Promise<boolean> {
        this._logger.info(`Confirming email change for userId ${userId}`);
        try {
            const record = await this._dataAccess.getByUserId(userId, email);

            const user = await this._userService.getUserIdByMail(email);
            if (user) {
                throw new ValidationError({
                    message: `Email ${email} is already in use`,
                    errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                });
            }
            if (!record) {
                throw new ValidationError({
                    message: `No pending email change found for userId ${userId}`,
                    errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                    payload: {
                        field: 'confirmationCode',
                        reason: 'validation:codeInvalided',
                    },
                });
            }

            if (Time.getISODate(record.expiresAt) < Time.getISODateNowUTC()) {
                throw new ValidationError({
                    message: `No pending email change found for userId ${userId}`,
                    errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                    payload: {
                        field: 'confirmationCode',
                        reason: 'validation:codeExpired',
                    },
                });
            }

            ConfirmationHelper.validateCode(record.confirmationCode, confirmationCode);

            await this._dataAccess.confirm(userId, trx);
            await this._userService.patch(userId, { email: record.email }, trx);

            this._logger.info(`Email change confirmed for userId ${userId}, new email: ${record.email}`);
            return true;
        } catch (e) {
            this._logger.error(`Email change confirmation failed for userId ${userId}: ${(e as { message: string }).message}`);
            throw e;
        }
    }
    public async refresh(userId: number, email: string): Promise<boolean> {
        this._logger.info(`Refresh confirmation code email change for userId ${userId}`);
        try {
            const record = await this._dataAccess.getByUserId(userId, email);

            if (!record) {
                throw new ValidationError({
                    message: 'Sending confirmation code failed, no pending email change request',
                    errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                });
            }

            const expiresAt = ConfirmationHelper.createExpiresAt(CHANGE_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();
            await this._dataAccess.refresh(userId, email, confirmationCode, expiresAt);
            this._logger.info(`Refresh confirmation code email change send for userId ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Refresh confirmation code email change failed for userId ${userId}: ${(e as { message: string }).message}`,
            );
            throw e;
        }
    }
}
