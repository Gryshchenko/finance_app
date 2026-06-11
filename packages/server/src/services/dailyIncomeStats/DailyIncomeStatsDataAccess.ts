import { Time, ErrorCode } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { DBError } from 'src/utils/errors/DBError';

export interface IDailyIncomeStatsScoreParams {
    userId: number;
    date: string;
    incomeId: number;
    sourceAmount: number;
    targetAmount: number;
    currencyId?: number;
    targetCurrencyId?: number;
    trx?: IDBTransaction;
}

export interface IDailyIncomeStatsDataAccess {
    updateTotal(params: IDailyIncomeStatsScoreParams): Promise<boolean>;
    addToScore: (params: IDailyIncomeStatsScoreParams) => Promise<boolean>;
    subtractFromScore: (params: IDailyIncomeStatsScoreParams) => Promise<boolean>;
    summary: (userId: number, id: number, from: string, to: string) => Promise<{ id: number; total: number }>;
}

export class DailyIncomeStatsDataAccess extends LoggerBase implements IDailyIncomeStatsDataAccess {
    constructor(private readonly _db: IDatabaseConnection) {
        super();
    }

    async summary(userId: number, id: number, from: string, to: string): Promise<{ id: number; total: number }> {
        try {
            const fromConverted = Time.toUTCISO(from);
            const toConverted = Time.toUTCISO(to);
            this._logger.info(
                `Fetching summary for userId: ${userId}, incomeId: ${id}, from: ${fromConverted}, to: ${toConverted}`,
            );
            const result = await this._db
                .engine()('daily_incomes_stats')
                .where({ userId, incomeId: id })
                .andWhereBetween('date', [fromConverted, toConverted])
                .sum({ total: this._db.engine().raw('source_total') })
                .first();
            const total = result?.total || 0;
            this._logger.info(`Successfully fetched summary for userId: ${userId}, incomeId: ${id}`);
            return { id, total };
        } catch (e) {
            this._logger.error(
                `Failed to fetch summary for userId: ${userId}, incomeId: ${id}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Failed to fetch summary due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }

    public async addToScore({
        userId,
        date,
        incomeId,
        sourceAmount,
        targetAmount,
        trx,
    }: IDailyIncomeStatsScoreParams): Promise<boolean> {
        try {
            this._logger.info(`AddToScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            const updatedAt = Time.getISODateNowUTC();
            await query('daily_incomes_stats')
                .insert({
                    userId,
                    date,
                    incomeId,
                    source_total: sourceAmount,
                    target_total: targetAmount,
                    updatedAt,
                })
                .onConflict(['userId', 'date', 'incomeId'])
                .merge({
                    source_total: query.raw('daily_incomes_stats.source_total + ?', [sourceAmount]),
                    target_total: query.raw('daily_incomes_stats.target_total + ?', [targetAmount]),
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
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }

    public async subtractFromScore({
        userId,
        date,
        incomeId,
        sourceAmount,
        targetAmount,
        trx,
    }: IDailyIncomeStatsScoreParams): Promise<boolean> {
        try {
            this._logger.info(`SubtractFromScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            const updatedAt = Time.getISODateNowUTC();
            await query('daily_incomes_stats')
                .insert({
                    userId,
                    date,
                    incomeId,
                    source_total: -sourceAmount,
                    target_total: -targetAmount,
                    updatedAt,
                })
                .onConflict(['userId', 'date', 'incomeId'])
                .merge({
                    source_total: query.raw('daily_incomes_stats.source_total - ?', [sourceAmount]),
                    target_total: query.raw('daily_incomes_stats.target_total - ?', [targetAmount]),
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
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }

    async updateTotal({
        userId,
        date,
        incomeId,
        sourceAmount,
        targetAmount,
        currencyId,
        targetCurrencyId,
        trx,
    }: IDailyIncomeStatsScoreParams): Promise<boolean> {
        const query = trx || this._db.engine();
        try {
            this._logger.info(`Starting update daily income stats userId: ${userId}, date: ${date}`);
            await query.raw(
                `
                INSERT INTO daily_incomes_stats ("userId", date, "incomeId", source_total, target_total, "currencyId", "targetCurrencyId")
                VALUES (?, ?::date, ?, ?, ?, ?, ?)
                ON CONFLICT ("userId", date, "incomeId")
                DO UPDATE SET
                    source_total = daily_incomes_stats.source_total + EXCLUDED.source_total,
                    target_total = daily_incomes_stats.target_total + EXCLUDED.target_total,
                    "currencyId" = EXCLUDED."currencyId",
                    "targetCurrencyId" = EXCLUDED."targetCurrencyId",
                    "updatedAt" = NOW();
            `,
                [userId, date, incomeId, sourceAmount, targetAmount, currencyId, targetCurrencyId],
            );

            this._logger.info(`Successfully update daily income stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed update daily income stats for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Update daily income stats failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }
}
