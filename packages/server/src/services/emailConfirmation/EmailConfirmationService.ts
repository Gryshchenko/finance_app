import { ErrorCode, HttpCode, UserStatus, Time } from 'tenpercent/shared';

import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ConfirmationHelper } from 'services/confirmation/ConfirmationHelper';
import { IEmailConfirmationDataAccess } from 'services/emailConfirmation/EmailConfirmationDataAccess';
import { IUserService } from 'services/user/UserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ValidationError } from 'src/utils/errors/ValidationError';

const CHANGE_CODE_EXPIRES_IN: [number, number, number] = [0, 10, 0];

export interface IEmailConfirmationService {
    request(userId: number, email: string, trx?: IDBTransaction): Promise<boolean>;
    confirm(userId: number, email: string, confirmationCode: number, trx?: IDBTransaction): Promise<{ confirmationId: number }>;
    refresh(userId: number, email: string): Promise<boolean>;
}

export default class EmailConfirmationService extends LoggerBase implements IEmailConfirmationService {
    protected _dataAccess: IEmailConfirmationDataAccess;
    protected userService: IUserService;

    public constructor(emailConfirmationDataAccess: IEmailConfirmationDataAccess, userService: IUserService) {
        super();
        this._dataAccess = emailConfirmationDataAccess;
        this.userService = userService;
    }

    public async request(userId: number, email: string, trx?: IDBTransaction): Promise<boolean> {
        this._logger.info(`Email change requested for userId ${userId}`);
        try {
            const record = await this._dataAccess.getByUserId(userId, email);
            const expiresAt = ConfirmationHelper.createExpiresAt(CHANGE_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();
            if (!record) {
                await this._dataAccess.create(userId, email, confirmationCode, expiresAt, trx);
                this._logger.info(`Email change request created for userId ${userId}`);
                return true;
            } else {
                await this._dataAccess.refresh(userId, email, confirmationCode, expiresAt);
                this._logger.info(`Email change request created for userId ${userId}`);
                return true;
            }
        } catch (e) {
            this._logger.error(`Email change request failed for userId ${userId}: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    public async refresh(userId: number, email: string): Promise<boolean> {
        this._logger.info(`Refresh confirmation code email change for userId ${userId}`);
        try {
            const record = await this._dataAccess.getByUserId(userId, email);

            const expiresAt = ConfirmationHelper.createExpiresAt(CHANGE_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();
            if (!record) {
                await this._dataAccess.create(userId, email, confirmationCode, expiresAt);
            } else {
                await this._dataAccess.refresh(userId, email, confirmationCode, expiresAt);
            }
            this._logger.info(`Refresh confirmation code email change send for userId ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Refresh confirmation code email change failed for userId ${userId}: ${(e as { message: string }).message}`,
            );
            throw e;
        }
    }

    public async confirm(
        userId: number,
        email: string,
        confirmationCode: number,
        trx?: IDBTransaction,
    ): Promise<{ confirmationId: number }> {
        this._logger.info(`Confirming email change for userId ${userId}`);
        try {
            const record = await this._dataAccess.getByUserId(userId, email);

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

            if (Time.jsDateToUTCISO(record.expiresAt) < Time.getISODateNowUTC()) {
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

            const result = await this._dataAccess.confirm(userId, email, trx);
            await this.userService.patch(userId, { status: UserStatus.ACTIVE, email: record.email }, trx);

            this._logger.info(`Email change confirmed for userId ${userId}, new email: ${record.email}`);
            return result;
        } catch (e) {
            this._logger.error(`Email change confirmation failed for userId ${userId}: ${(e as { message: string }).message}`);
            throw e;
        }
    }
}
