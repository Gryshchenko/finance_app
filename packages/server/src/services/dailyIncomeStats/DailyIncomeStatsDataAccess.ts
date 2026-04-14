import { Time } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { DBError } from 'src/utils/errors/DBError';

export interface IDailyIncomeStatsDataAccess {
    updateTotal(userId: number, date: string, incomeId: number, amount: number, trx?: IDBTransaction): Promise<boolean>;
    addToScore: (userId: number, date: string, amount: number, incomeId: number, trx?: IDBTransaction) => Promise<boolean>;
    subtractFromScore: (userId: number, date: string, amount: number, incomeId: number, trx?: IDBTransaction) => Promise<boolean>;
}

export class DailyIncomeStatsDataAccess extends LoggerBase implements IDailyIncomeStatsDataAccess {
    constructor(private readonly _db: IDatabaseConnection) {
        super();
    }

    public async addToScore(
        userId: number,
        date: string,
        amount: number,
        incomeId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        try {
            this._logger.info(`AddToScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            const updatedAt = Time.getISODateNowUTC();
            await query('daily_incomes_stats')
                .insert({
                    userId,
                    date,
                    incomeId,
                    updatedAt,
                })
                .onConflict(['userId', 'date', 'incomeId'])
                .merge({
                    amount_total: query.raw('daily_incomes_stats.amount_total + ?', [amount]),
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
        incomeId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        try {
            this._logger.info(`SubtractFromScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            const updatedAt = Time.getISODateNowUTC();
            await query('daily_incomes_stats')
                .insert({
                    userId,
                    date,
                    incomeId,
                    updatedAt,
                })
                .onConflict(['userId', 'date', 'incomeId'])
                .merge({
                    amount_total: query.raw('daily_incomes_stats.amount_total - ?', [amount]),
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

    async updateTotal(userId: number, date: string, incomeId: number, amount: number, trx?: IDBTransaction): Promise<boolean> {
        const query = trx || this._db.engine();
        try {
            this._logger.info(`Starting update daily income stats userId: ${userId}, date: ${date}`);
            await query.raw(
                `
                INSERT INTO daily_incomes_stats ("userId", date, "incomeId", amount_total)
                VALUES (?, ?::date, ?, ?)
                ON CONFLICT ("userId", date, "incomeId")
                DO UPDATE SET
                    amount_total = daily_incomes_stats.amount_total + EXCLUDED.amount_total,
                    "updatedAt" = NOW();
            `,
                [userId, date, incomeId, amount],
            );

            this._logger.info(`Successfully update daily income stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed update daily income stats for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Update daily income stats failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }
}
