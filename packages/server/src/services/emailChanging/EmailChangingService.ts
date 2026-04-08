import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { ErrorCode, HttpCode } from 'tenpercent/shared';
import { IEmailChangingDataAccess } from 'services/emailChanging/EmailChangingDataAccess';
import { IUserService } from 'services/user/UserService';
import { ConfirmationHelper } from 'services/confirmation/ConfirmationHelper';

const CHANGE_CODE_EXPIRES_IN: [number, number, number] = [0, 10, 0];

export interface IEmailChangingService {
    request(userId: number, newEmail: string, trx?: IDBTransaction): Promise<{ confirmationCode: number; expiresAt: Date }>;
    confirm(userId: number, confirmationCode: number, trx?: IDBTransaction): Promise<boolean>;
    refresh(userId: number, confirmationId: number): Promise<boolean>;
}

export default class EmailChangingService extends LoggerBase implements IEmailChangingService {
    private readonly _dataAccess: IEmailChangingDataAccess;
    private readonly _userService: IUserService;

    public constructor(dataAccess: IEmailChangingDataAccess, userService: IUserService) {
        super();
        this._dataAccess = dataAccess;
        this._userService = userService;
    }

    public async request(
        userId: number,
        newEmail: string,
        trx?: IDBTransaction,
    ): Promise<{ confirmationCode: number; expiresAt: Date }> {
        this._logger.info(`Email change requested for userId ${userId}`);
        try {
            const expiresAt = ConfirmationHelper.createExpiresAt(CHANGE_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();

            await this._dataAccess.create(userId, newEmail, confirmationCode, expiresAt, trx);

            this._logger.info(`Email change request created for userId ${userId}`);
            return { confirmationCode, expiresAt };
        } catch (e) {
            this._logger.error(`Email change request failed for userId ${userId}: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    public async confirm(userId: number, confirmationCode: number, trx?: IDBTransaction): Promise<boolean> {
        this._logger.info(`Confirming email change for userId ${userId}`);
        try {
            const record = await this._dataAccess.getByUserId(userId);

            if (!record) {
                throw new ValidationError({
                    message: `No pending email change found for userId ${userId}`,
                    errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                    statusCode: HttpCode.NOT_FOUND,
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
    public async refresh(userId: number, confirmationId: number): Promise<boolean> {
        this._logger.info(`Refresh confirmation code email change for userId ${userId}`);
        try {
            const record = await this._dataAccess.getByUserId(userId);

            if (!record) {
                throw new ValidationError({
                    message: 'Sending confirmation code failed, code expired',
                    errorCode: ErrorCode.PROFILE_PASSWORD_VERIFICATION_CODE_EXPIRED_ERROR,
                    payload: {
                        field: 'confirmationCode',
                    },
                });
            }
            const expiresAt = ConfirmationHelper.createExpiresAt(CHANGE_CODE_EXPIRES_IN);
            const confirmationCode = ConfirmationHelper.generateCode();
            await this._dataAccess.refresh(userId, confirmationId, confirmationCode, expiresAt);
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
