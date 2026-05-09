import { ErrorCode, HttpCode } from 'tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IEmailChanging } from 'interfaces/IEmailChanging';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { BaseError } from 'src/utils/errors/BaseError';
import { DBError } from 'src/utils/errors/DBError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { ValidationError } from 'src/utils/errors/ValidationError';

export interface IEmailChangingDataAccess {
    create(
        userId: number,
        email: string,
        confirmationCode: number,
        expiresAt: Date,
        trx?: IDBTransaction,
    ): Promise<IEmailChanging>;
    getByUserId(userId: number, email: string): Promise<IEmailChanging | undefined>;
    confirm(userId: number, trx?: IDBTransaction): Promise<boolean>;
    refresh(userId: number, email: string, confirmationCode: number, expiresAt: Date): Promise<boolean>;
}

export default class EmailChangingDataAccess extends LoggerBase implements IEmailChangingDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async create(
        userId: number,
        email: string,
        confirmationCode: number,
        expiresAt: Date,
        trx?: IDBTransaction,
    ): Promise<IEmailChanging> {
        this._logger.info(`Creating email change request for userId ${userId}`);
        try {
            const query = trx || this._db.engine();
            const [data] = await query<IEmailChanging>('email_changing')
                .insert({ userId, email, confirmationCode, expiresAt }, ['*'])
                .returning(['id']);

            this._logger.info(`Email change request created for userId ${userId}`);
            return data.id;
        } catch (e) {
            this._logger.error(`Error creating email change request for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error creating email change request for userId ${userId}: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.EMAIL_CHANGING_ERROR,
            });
        }
    }

    public async getByUserId(userId: number, email: string): Promise<IEmailChanging | undefined> {
        this._logger.info(`Fetching email change request for userId ${userId}`);
        try {
            const data = await this._db
                .engine()<IEmailChanging>('email_changing')
                .where({ userId, confirmed: false, email })
                .orderBy('expiresAt', 'desc')
                .first();

            return data || undefined;
        } catch (e) {
            this._logger.error(`Error fetching email change request for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error fetching email change request for userId ${userId}: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.EMAIL_CHANGING_ERROR,
            });
        }
    }

    public async confirm(userId: number, trx?: IDBTransaction): Promise<boolean> {
        this._logger.info(`Confirming email change for userId ${userId}`);
        try {
            const query = trx || this._db.engine();
            const updated = await query<IEmailChanging>('email_changing')
                .where({ userId, confirmed: false })
                .update({ confirmed: true });

            if (!updated) {
                throw new ValidationError({
                    message: `No pending email change found for userId ${userId}`,
                    errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                    statusCode: HttpCode.NOT_FOUND,
                });
            }

            this._logger.info(`Email change confirmed for userId ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(`Error confirming email change for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error confirming email change for userId ${userId}: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.EMAIL_CHANGING_ERROR,
            });
        }
    }
    public async refresh(userId: number, email: string, confirmationCode: number, expiresAt: Date): Promise<boolean> {
        this._logger.info(`Refresh confirmation code for userId ${userId}`);
        try {
            const query = this._db.engine();
            const updated = await query<IEmailChanging>('email_changing')
                .where({ userId, confirmed: false, email })
                .update({ expiresAt, confirmationCode });

            if (!updated) {
                throw new ValidationError({
                    message: `No pending email change found for userId ${userId}`,
                    errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                    statusCode: HttpCode.NOT_FOUND,
                });
            }

            this._logger.info(`Refresh confirmation code success for userId ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Refresh confirmation code change failed for userId ${userId}: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Refresh confirmation code change failed for userId ${userId}: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.EMAIL_CHANGING_ERROR,
            });
        }
    }
}
