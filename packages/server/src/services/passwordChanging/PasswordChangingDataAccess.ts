import { IPasswordChanging } from 'interfaces/IPasswordChanging';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { BaseError } from 'src/utils/errors/BaseError';
import { ErrorCode, HttpCode, Time } from 'tenpercent/shared';

export interface IPasswordChangingDataAccess {
    create(
        userId: number,
        passwordHash: string,
        salt: string,
        confirmationCode: number,
        expiresAt: Date,
        trx?: IDBTransaction,
    ): Promise<IPasswordChanging>;
    getByUserId(userId: number): Promise<IPasswordChanging | undefined>;
    confirm(userId: number, id: number, trx?: IDBTransaction): Promise<boolean>;
    refresh(userId: number, confirmationId: number, confirmationCode: number, expiresAt: Date): Promise<boolean>;
}
export default class PasswordChangingDataAccess extends LoggerBase implements IPasswordChangingDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    public async create(
        userId: number,
        passwordHash: string,
        salt: string,
        confirmationCode: number,
        expiresAt: Date,
        trx?: IDBTransaction,
    ): Promise<IPasswordChanging> {
        this._logger.info(`Creating password change request for userId ${userId}`);
        try {
            const query = trx || this._db.engine();
            const data = await query<IPasswordChanging>('password_changing')
                .insert({ userId, passwordHash, salt, confirmationCode, expiresAt }, ['*'])
                .onConflict(['userId', 'passwordHash'])
                .merge(['salt', 'confirmationCode', 'expiresAt', 'confirmed']);

            this._logger.info(`Password change request created for userId ${userId}`);
            return data[0];
        } catch (e) {
            this._logger.error(
                `Error creating password change request for userId ${userId}: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Error creating password change request for userId ${userId}: ${(e as { message: string }).message}`,
            });
        }
    }

    public async getByUserId(userId: number): Promise<IPasswordChanging | undefined> {
        this._logger.info(`Fetching password change request for userId ${userId}`);
        try {
            const data = await this._db
                .engine()<IPasswordChanging>('password_changing')
                .where({ userId, confirmed: false })
                .andWhere('expiresAt', '>', Time.getISODateNowUTC())
                .orderBy('expiresAt', 'desc')
                .first();

            return data || undefined;
        } catch (e) {
            this._logger.error(
                `Error fetching password change request for userId ${userId}: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Error fetching password change request for userId ${userId}: ${(e as { message: string }).message}`,
            });
        }
    }

    public async confirm(userId: number, id: number, trx?: IDBTransaction): Promise<boolean> {
        this._logger.info(`Confirming password change for userId ${userId}`);
        try {
            const query = trx || this._db.engine();
            const updated = await query<IPasswordChanging>('password_changing')
                .where({ userId, confirmed: false, id })
                .update({ confirmed: true });

            if (!updated) {
                throw new ValidationError({
                    message: `No pending password change found for userId ${userId}`,
                    errorCode: ErrorCode.AUTH_ERROR,
                    statusCode: HttpCode.NOT_FOUND,
                });
            }

            this._logger.info(`Password change confirmed for userId ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(`Error confirming password change for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error confirming password change for userId ${userId}: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }
    public async refresh(userId: number, confirmationId: number, confirmationCode: number, expiresAt: Date): Promise<boolean> {
        this._logger.info(`Refresh confirmation code for userId ${userId}`);
        try {
            const query = this._db.engine();
            const updated = await query<IPasswordChanging>('password_changing')
                .where({ userId, confirmed: false, id: confirmationId })
                .update({ expiresAt, confirmationCode });

            if (!updated) {
                throw new ValidationError({
                    message: `No pending password change found for userId ${userId}`,
                    errorCode: ErrorCode.AUTH_ERROR,
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
            });
        }
    }
}
