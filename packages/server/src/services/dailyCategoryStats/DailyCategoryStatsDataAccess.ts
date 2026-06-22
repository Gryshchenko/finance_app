import { Time, ErrorCode } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { DBError } from 'src/utils/errors/DBError';

export interface IDailyCategoryStatsScoreParams {
    userId: number;
    date: string;
    categoryId: number;
    sourceAmount: number;
    targetAmount: number;
    currencyCode?: string;
    targetCurrencyCode?: string;
    trx?: IDBTransaction;
}

export interface IDailyCategoryStatsDataAccess {
    updateTotal(params: IDailyCategoryStatsScoreParams): Promise<boolean>;
    addToScore: (params: IDailyCategoryStatsScoreParams) => Promise<boolean>;
    subtractFromScore: (params: IDailyCategoryStatsScoreParams) => Promise<boolean>;
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
                .sum({ total: this._db.engine().raw('target_total') })
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
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }

    public async addToScore({
        userId,
        date,
        categoryId,
        sourceAmount,
        targetAmount,
        trx,
    }: IDailyCategoryStatsScoreParams): Promise<boolean> {
        try {
            this._logger.info(`AddToScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            const updatedAt = Time.getISODateNowUTC();
            await query('daily_categories_stats')
                .insert({
                    userId,
                    date,
                    categoryId,
                    source_total: sourceAmount,
                    target_total: targetAmount,
                    updatedAt,
                })
                .onConflict(['userId', 'date', 'categoryId'])
                .merge({
                    source_total: query.raw('daily_categories_stats.source_total + ?', [sourceAmount]),
                    target_total: query.raw('daily_categories_stats.target_total + ?', [targetAmount]),
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
        categoryId,
        sourceAmount,
        targetAmount,
        trx,
    }: IDailyCategoryStatsScoreParams): Promise<boolean> {
        try {
            this._logger.info(`SubtractFromScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            const updatedAt = Time.getISODateNowUTC();
            await query('daily_categories_stats')
                .insert({
                    userId,
                    date,
                    categoryId,
                    source_total: -sourceAmount,
                    target_total: -targetAmount,
                    updatedAt,
                })
                .onConflict(['userId', 'date', 'categoryId'])
                .merge({
                    source_total: query.raw('daily_categories_stats.source_total - ?', [sourceAmount]),
                    target_total: query.raw('daily_categories_stats.target_total - ?', [targetAmount]),
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
        categoryId,
        sourceAmount,
        targetAmount,
        currencyCode,
        targetCurrencyCode,
        trx,
    }: IDailyCategoryStatsScoreParams): Promise<boolean> {
        try {
            const query = trx || this._db.engine();
            this._logger.info(`Starting update daily category stats userId: ${userId}, date: ${date}`);
            await query.raw(
                `
                INSERT INTO daily_categories_stats ("userId", date, "categoryId", source_total, target_total, "currencyCode", "targetCurrencyCode")
                VALUES (?, ?::date, ?, ?, ?, ?, ?)
                ON CONFLICT ("userId", date, "categoryId")
                DO UPDATE SET
                    source_total = daily_categories_stats.source_total + EXCLUDED.source_total,
                    target_total = daily_categories_stats.target_total + EXCLUDED.target_total,
                    "currencyCode" = EXCLUDED."currencyCode",
                    "targetCurrencyCode" = EXCLUDED."targetCurrencyCode",
                    "updatedAt" = NOW();
                `,
                [userId, date, categoryId, sourceAmount, targetAmount, currencyCode, targetCurrencyCode],
            );

            this._logger.info(`Successfully update daily category stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed update daily category stats for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Update daily category stats failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }
}
