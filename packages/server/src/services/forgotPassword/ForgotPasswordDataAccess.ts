import { Time, ErrorCode } from '@tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IForgotPassword } from 'interfaces/IForgotPassword';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';

export interface IForgotPasswordDataAccess {
    create(userId: number, email: string, confirmationCode: number, expiresAt: Date): Promise<boolean>;
    getRecord(email: string, confirmationCode?: number): Promise<IForgotPassword | undefined>;
    confirm(email: string, confirmationCode: number, trx?: IDBTransaction): Promise<boolean>;
    refresh(email: string, confirmationCode: number, expiresAt: Date): Promise<boolean>;
}

export default class ForgotPasswordDataAccess extends LoggerBase implements IForgotPasswordDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async create(userId: number, email: string, confirmationCode: number, expiresAt: Date): Promise<boolean> {
        this._logger.info(`Creating forgot password request for userId: ${userId}`);
        try {
            await this._db
                .engine()<IForgotPassword>('password_forgot')
                .insert({ userId, email, confirmationCode, expiresAt, confirmed: false });

            this._logger.info(`Forgot password request created for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Error upserting forgot password request for userId ${userId}: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Error creating forgot password request for userId ${userId}: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.FORGOT_PASSWORD_ERROR,
            });
        }
    }

    public async getRecord(email: string, confirmationCode?: number): Promise<IForgotPassword | undefined> {
        this._logger.info(`Fetching active forgot password request`);
        try {
            const qr = this._db
                .engine()<IForgotPassword>('password_forgot')
                .where((qr) => {
                    qr.where({ email, confirmed: false });
                    if (confirmationCode) {
                        qr.andWhere({ confirmationCode });
                    }
                })
                .andWhere('expiresAt', '>', Time.getISODateNowUTC())
                .orderBy('expiresAt', 'desc')
                .first();

            const data = await qr;

            return data || undefined;
        } catch (e) {
            this._logger.error(`Error fetching active forgot password request: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error fetching active forgot password request: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.FORGOT_PASSWORD_ERROR,
            });
        }
    }

    public async confirm(email: string, confirmationCode: number, trx?: IDBTransaction): Promise<boolean> {
        this._logger.info(`Confirming forgot password request`);
        try {
            const query = trx || this._db.engine();
            const updated = await query<IForgotPassword>('password_forgot')
                .where({ email, confirmed: false, confirmationCode })
                .update({ confirmed: true });

            this._logger.info(`Forgot password request confirmed, rows updated: ${updated}`);
            return updated > 0;
        } catch (e) {
            this._logger.error(`Error confirming forgot password request: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error confirming forgot password request: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.FORGOT_PASSWORD_ERROR,
            });
        }
    }

    public async refresh(email: string, confirmationCode: number, expiresAt: Date): Promise<boolean> {
        this._logger.info(`Refreshing confirmation code for forgot password request`);
        try {
            const updated = await this._db
                .engine()<IForgotPassword>('password_forgot')
                .where({ email, confirmed: false })
                .update({ confirmationCode, expiresAt });

            this._logger.info(`Confirmation code refreshed, rows updated: ${updated}`);
            return updated > 0;
        } catch (e) {
            this._logger.error(`Error refreshing confirmation code: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error refreshing confirmation code: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.FORGOT_PASSWORD_ERROR,
            });
        }
    }
}
