import { ISummary, StatsPeriod, ErrorCode } from 'tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { StatsTransactionType } from 'types/StatsTransactionType';

export interface IDailyStatsDataAccess {
    updateTotal: (
        userId: number,
        date: string,
        category: StatsTransactionType,
        amount: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
    addToScore: (
        userId: number,
        date: string,
        income_total: number,
        expense_total: number,
        transfer_total: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
    subtractFromScore: (
        userId: number,
        date: string,
        income_total: number,
        expense_total: number,
        transfer_total: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
    summary(userId: number, from: string, to: string, period: StatsPeriod): Promise<ISummary>;
}

export default class DailyStatsDataAccess extends LoggerBase implements IDailyStatsDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async addToScore(
        userId: number,
        date: string,
        income_total: number,
        expense_total: number,
        transfer_total: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        try {
            this._logger.info(`AddToScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            await query('daily_stats')
                .insert({
                    userId,
                    date,
                    income_total,
                    expense_total,
                    transfer_total,
                })
                .onConflict(['userId', 'date'])
                .merge({
                    income_total: query.raw('daily_stats.income_total + ?', [income_total]),
                    expense_total: query.raw('daily_stats.expense_total + ?', [expense_total]),
                    transfer_total: query.raw('daily_stats.transfer_total + ?', [transfer_total]),
                });
            this._logger.info(`Successfully addToScore daily stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed addToScore daily stats for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `addToScore daily stats failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }

    public async subtractFromScore(
        userId: number,
        date: string,
        income_total: number,
        expense_total: number,
        transfer_total: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        try {
            this._logger.info(`SubtractFromScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            await query('daily_stats')
                .insert({
                    userId,
                    date,
                    income_total,
                    expense_total,
                    transfer_total,
                })
                .onConflict(['userId', 'date'])
                .merge({
                    income_total: query.raw('daily_stats.income_total - ?', [income_total]),
                    expense_total: query.raw('daily_stats.expense_total - ?', [expense_total]),
                    transfer_total: query.raw('daily_stats.transfer_total - ?', [transfer_total]),
                });
            this._logger.info(`Successfully subtractFromScore daily stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed subtractFromScore daily stats for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `SubtractFromScore daily stats failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }

    public async summary(userId: number, from: string, to: string, period: StatsPeriod): Promise<ISummary> {
        try {
            this._logger.info(`Get daily stats userId: ${userId}, for period ${period}, from: ${from}, to: ${to}`);

            const query = this._db.engine();
            const { rows } = await query.raw(
                `
                SELECT
                    COALESCE(SUM(ds.income_total),0) as income_total,
                    COALESCE(SUM(ds.expense_total),0) as expense_total,
                    COALESCE(SUM(ds.transfer_total),0) as transfer_total
                FROM daily_stats as ds
                WHERE ds."userId" = ? AND ds.date >= ?::date AND ds.date <= ?::date
            `,
                [userId, from, to],
            );
            const data = rows[0];
            this._logger.info(`Successfully get daily stats for userId: ${userId}`);
            return {
                ...data,
                from,
                to,
            } as ISummary;
        } catch (e) {
            this._logger.error(`Failed get daily stats for userId: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Get daily stats failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }

    public async updateTotal(
        userId: number,
        date: string,
        category: StatsTransactionType,
        amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        try {
            this._logger.info(`Starting update daily stats userId: ${userId}, date: ${date}`);

            const query = trx || this._db.engine();
            await query.raw(
                `
                    INSERT INTO daily_stats ("userId", date, income_total, expense_total, transfer_total)
                    VALUES (?, ?::date,
                            CASE WHEN ? = 'income' THEN ? ELSE 0::numeric END,
                            CASE WHEN ? = 'expense' THEN ? ELSE 0::numeric END,
                            CASE WHEN ? = 'transfer' THEN ? ELSE 0::numeric END)
                    ON CONFLICT ("userId", date)
                    DO UPDATE SET
                        income_total = daily_stats.income_total + CASE WHEN EXCLUDED.income_total   <> 0 THEN EXCLUDED.income_total   ELSE 0 END,
                        expense_total  = daily_stats.expense_total + CASE WHEN EXCLUDED.expense_total  <> 0 THEN EXCLUDED.expense_total  ELSE 0 END,
                        transfer_total  = daily_stats.transfer_total + CASE WHEN EXCLUDED.transfer_total  <> 0 THEN EXCLUDED.transfer_total  ELSE 0 END,
                        "updatedAt" = NOW();
        `,
                [userId, date, category, amount, category, amount, category, amount],
            );
            this._logger.info(`Successfully update daily stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(`Failed update daily stats for userId: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Update daily stats failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }
}
