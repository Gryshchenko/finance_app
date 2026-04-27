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
    summary: (userId: number, id: number, from: string, to: string) => Promise<{ id: number; total: number }>;
}

export class DailyCategoryStatsDataAccess extends LoggerBase implements IDailyCategoryStatsDataAccess {
    constructor(private readonly _db: IDatabaseConnection) {
        super();
    }

    async summary(userId: number, id: number, from: string, to: string): Promise<{ id: number; total: number }> {
        try {
            const fromConverted = Time.toUTCISO(from);
            const toConverted = Time.toUTCISO(to);
            this._logger.info(
                `Fetching summary for userId: ${userId}, categoryId: ${id}, from: ${fromConverted}, to: ${toConverted}`,
            );
            const result = await this._db
                .engine()('daily_categories_stats')
                .where({ userId, categoryId: id })
                .andWhereBetween('date', [fromConverted, toConverted])
                .sum({ total: this._db.engine().raw('amount_total') })
                .first();
            const total = result?.total || 0;
            this._logger.info(`Successfully fetched summary for userId: ${userId}, categoryId: ${id}`);
            return { id, total };
        } catch (e) {
            this._logger.error(
                `Failed to fetch summary for userId: ${userId}, categoryId: ${id}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Failed to fetch summary due to a database error: ${(e as { message: string }).message}`,
            });
        }
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
