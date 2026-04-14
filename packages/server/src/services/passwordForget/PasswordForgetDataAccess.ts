import { Time } from 'tenpercent/shared';

import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { IPasswordForget } from 'interfaces/IPasswordForget';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';

export interface IPasswordForgetDataAccess {
    upsert(userId: number, email: string, confirmationCode: number, expiresAt: Date): Promise<boolean>;
    getActiveByEmail(email: string): Promise<IPasswordForget | undefined>;
    confirm(email: string): Promise<boolean>;
    refresh(email: string, confirmationCode: number, expiresAt: Date): Promise<boolean>;
}

export default class PasswordForgetDataAccess extends LoggerBase implements IPasswordForgetDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async upsert(userId: number, email: string, confirmationCode: number, expiresAt: Date): Promise<boolean> {
        this._logger.info(`Upserting password forget request for userId: ${userId}`);
        try {
            await this._db
                .engine()<IPasswordForget>('password_forgot')
                .insert({ userId, email, confirmationCode, expiresAt, confirmed: false })
                .onConflict(['email', 'userId'])
                .merge(['userId', 'confirmationCode', 'expiresAt', 'confirmed']);

            this._logger.info(`Password forget request upserted for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Error upserting password forget request for userId ${userId}: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Error upserting password forget request for userId ${userId}: ${(e as { message: string }).message}`,
            });
        }
    }

    public async getActiveByEmail(email: string): Promise<IPasswordForget | undefined> {
        this._logger.info(`Fetching active password forget request`);
        try {
            const data = await this._db
                .engine()<IPasswordForget>('password_forgot')
                .where({ email, confirmed: false })
                .andWhere('expiresAt', '>', Time.getISODateNowUTC())
                .orderBy('expiresAt', 'desc')
                .first();

            return data || undefined;
        } catch (e) {
            this._logger.error(`Error fetching active password forget request: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error fetching active password forget request: ${(e as { message: string }).message}`,
            });
        }
    }

    public async confirm(email: string): Promise<boolean> {
        this._logger.info(`Confirming password forget request`);
        try {
            const updated = await this._db
                .engine()<IPasswordForget>('password_forgot')
                .where({ email, confirmed: false })
                .update({ confirmed: true });

            this._logger.info(`Password forget request confirmed, rows updated: ${updated}`);
            return updated > 0;
        } catch (e) {
            this._logger.error(`Error confirming password forget request: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error confirming password forget request: ${(e as { message: string }).message}`,
            });
        }
    }

    public async refresh(email: string, confirmationCode: number, expiresAt: Date): Promise<boolean> {
        this._logger.info(`Refreshing confirmation code for password forget request`);
        try {
            const updated = await this._db
                .engine()<IPasswordForget>('password_forgot')
                .where({ email, confirmed: false })
                .update({ confirmationCode, expiresAt });

            this._logger.info(`Confirmation code refreshed, rows updated: ${updated}`);
            return updated > 0;
        } catch (e) {
            this._logger.error(`Error refreshing confirmation code: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error refreshing confirmation code: ${(e as { message: string }).message}`,
            });
        }
    }
}
