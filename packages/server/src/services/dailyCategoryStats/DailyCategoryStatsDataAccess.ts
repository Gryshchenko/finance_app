import { Time } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { DBError } from 'src/utils/errors/DBError';

export interface IDailyCategoryStatsDataAccess {
    updateTotal(userId: number, date: string, categoryId: number, amount: number, trx?: IDBTransaction): Promise<boolean>;
    addToScore: (userId: number, date: string, amount: number, categoryId: number, trx?: IDBTransaction) => Promise<boolean>;
    subtractFromScore: (
        userId: number,
        date: string,
        amount: number,
        categoryId: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
}

export class DailyCategoryStatsDataAccess extends LoggerBase implements IDailyCategoryStatsDataAccess {
    constructor(private readonly _db: IDatabaseConnection) {
        super();
    }

    public async addToScore(
        userId: number,
        date: string,
        amount: number,
        categoryId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        try {
            this._logger.info(`AddToScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            const updatedAt = Time.getISODateNowUTC();
            await query('daily_categories_stats')
                .insert({
                    userId,
                    date,
                    categoryId,
                    updatedAt,
                })
                .onConflict(['userId', 'date', 'categoryId'])
                .merge({
                    amount_total: query.raw('daily_categories_stats.amount_total + ?', [amount]),
                    updatedAt,
                });
            this._logger.info(`Successfully addToScore daily stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed addToScore daily stats for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `addToScore daily stats failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }

    public async subtractFromScore(
        userId: number,
        date: string,
        amount: number,
        categoryId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        try {
            this._logger.info(`SubtractFromScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            const updatedAt = Time.getISODateNowUTC();
            await query('daily_categories_stats')
                .insert({
                    userId,
                    date,
                    categoryId,
                    updatedAt,
                })
                .onConflict(['userId', 'date', 'categoryId'])
                .merge({
                    amount_total: query.raw('daily_categories_stats.amount_total - ?', [amount]),
                    updatedAt,
                });
            this._logger.info(`Successfully subtractFromScore daily stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed subtractFromScore daily stats for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `SubtractFromScore daily stats failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }

    async updateTotal(userId: number, date: string, categoryId: number, amount: number, trx?: IDBTransaction): Promise<boolean> {
        try {
            const query = trx || this._db.engine();
            this._logger.info(`Starting update daily category stats userId: ${userId}, date: ${date}`);
            await query.raw(
                `
                INSERT INTO daily_categories_stats ("userId", date, "categoryId", amount_total)
                VALUES (?, ?::date, ?, ?)
                ON CONFLICT ("userId", date, "categoryId")
                DO UPDATE SET
                    amount_total = daily_categories_stats.amount_total + EXCLUDED.amount_total,
                    "updatedAt" = NOW();
                `,
                [userId, date, categoryId, amount],
            );

            this._logger.info(`Successfully update daily category stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed update daily category stats for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Update daily category stats failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }
}
