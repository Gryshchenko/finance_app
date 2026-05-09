import { ErrorCode, HttpCode } from 'tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IEmailConfirmationData } from 'interfaces/IEmailConfirmationData';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { ValidationError } from 'src/utils/errors/ValidationError';

export interface IEmailConfirmationDataAccess {
    create(userId: number, email: string, confirmationCode: number, expiresAt: Date, trx?: IDBTransaction): Promise<boolean>;
    getByUserId(userId: number, email: string): Promise<IEmailConfirmationData | undefined>;
    confirm(userId: number, email: string, trx?: IDBTransaction): Promise<{ confirmationId: number }>;
    refresh(userId: number, email: string, confirmationCode: number, expiresAt: Date): Promise<boolean>;
}

export default class EmailConfirmationDataAccess extends LoggerBase implements IEmailConfirmationDataAccess {
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
    ): Promise<boolean> {
        this._logger.info(`Creating email  request for userId ${userId}`);
        try {
            const query = trx || this._db.engine();
            await query<IEmailConfirmationData>('email_confirmations').insert({
                userId,
                email,
                confirmationCode,
                expiresAt,
                confirmed: false,
            });
            this._logger.info(`Email  request created for userId ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(`Error creating email  request for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error creating email  request for userId ${userId}: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
            });
        }
    }

    public async getByUserId(userId: number, email: string): Promise<IEmailConfirmationData | undefined> {
        this._logger.info(`Fetching email confirmation request for userId ${userId}`);
        try {
            const data = await this._db
                .engine()<IEmailConfirmationData>('email_confirmations')
                .where({ userId, confirmed: false, email })
                .orderBy('expiresAt', 'desc')
                .first();

            return data || undefined;
        } catch (e) {
            this._logger.error(`Error fetching email  request for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error fetching email  request for userId ${userId}: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
            });
        }
    }

    public async confirm(userId: number, email: string, trx?: IDBTransaction): Promise<{ confirmationId: number }> {
        this._logger.info(`Confirming email  for userId ${userId}`);
        try {
            const query = trx || this._db.engine();
            const [data] = await query<IEmailConfirmationData>('email_confirmations')
                .where({ userId, confirmed: false, email })
                .update({ confirmed: true })
                .returning(['confirmationId']);

            if (!data) {
                throw new ValidationError({
                    message: `No pending email confirmation for userId ${userId}`,
                    errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                    statusCode: HttpCode.NOT_FOUND,
                });
            }

            this._logger.info(`Email confirmed for userId ${userId}`);
            return { confirmationId: data.confirmationId };
        } catch (e) {
            this._logger.error(`Error confirming email  for userId ${userId}: ${(e as { message: string }).message}`);
            if (isBaseError(e)) throw e;
            throw new DBError({
                message: `Error confirming email  for userId ${userId}: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
            });
        }
    }

    public async refresh(userId: number, email: string, confirmationCode: number, expiresAt: Date): Promise<boolean> {
        this._logger.info(`Refresh confirmation code for userId ${userId}`);
        try {
            const query = this._db.engine();
            const updated = await query<IEmailConfirmationData>('email_confirmations')
                .where({ userId, confirmed: false, email })
                .update({ expiresAt, confirmationCode });

            if (!updated) {
                throw new ValidationError({
                    message: `No pending email for confirmation for userId ${userId}`,
                    errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                    statusCode: HttpCode.NOT_FOUND,
                });
            }

            this._logger.info(`Refresh confirmation code success for userId ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(`Refresh confirmation code  failed for userId ${userId}: ${(e as { message: string }).message}`);
            if (isBaseError(e)) throw e;
            throw new DBError({
                message: `Refresh confirmation code  failed for userId ${userId}: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
            });
        }
    }
}
