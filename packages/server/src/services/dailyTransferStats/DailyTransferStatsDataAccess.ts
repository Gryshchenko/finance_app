import { ErrorCode, Time } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { DBError } from 'src/utils/errors/DBError';

export interface IDailyTransferStatsUpdateTotalParams {
    userId: number;
    date: string;
    accountId: number;
    targetAccountId: number;
    sourceAmount: number;
    targetAmount: number;
    currencyId?: number;
    targetCurrencyId?: number;
    trx?: IDBTransaction;
}

export interface IDailyTransferStatsDataAccess {
    updateTotal(params: IDailyTransferStatsUpdateTotalParams): Promise<boolean>;

    summary: (
        userId: number,
        id: number,
        from: string,
        to: string,
    ) => Promise<{ id: number; source_total: number; target_total: number }>;
}

export class DailyTransferStatsDataAccess extends LoggerBase implements IDailyTransferStatsDataAccess {
    constructor(private readonly db: IDatabaseConnection) {
        super();
    }

    async updateTotal({
        userId,
        date,
        accountId,
        targetAccountId,
        sourceAmount,
        targetAmount,
        currencyId,
        targetCurrencyId,
        trx,
    }: IDailyTransferStatsUpdateTotalParams): Promise<boolean> {
        const query = trx || this.db.engine();

        await query.raw(
            `
            INSERT INTO daily_transfer_stats (
                "userId", date, "accountId", "targetAccountId", source_total, target_total, "currencyId", "targetCurrencyId"
            )
            VALUES (?, ?::date, ?, ?, ?, ?, ?, ?)
            ON CONFLICT ("userId", "accountId", "targetAccountId", date)
            DO UPDATE SET
                source_total = daily_transfer_stats.source_total + EXCLUDED.source_total,
                target_total = daily_transfer_stats.target_total + EXCLUDED.target_total,
                "currencyId" = EXCLUDED."currencyId",
                "targetCurrencyId" = EXCLUDED."targetCurrencyId",
                "updatedAt" = NOW();
            `,
            [userId, date, accountId, targetAccountId, sourceAmount, targetAmount, currencyId, targetCurrencyId],
        );

        return true;
    }

    async summary(
        userId: number,
        id: number,
        from: string,
        to: string,
    ): Promise<{ id: number; source_total: number; target_total: number }> {
        try {
            const fromConverted = Time.toUTCISO(from);
            const toConverted = Time.toUTCISO(to);
            this._logger.info(
                `Fetching summary for userId: ${userId}, accountId: ${id}, from: ${fromConverted}, to: ${toConverted}`,
            );
            const result = await this.db
                .engine()('daily_transfer_stats')
                .where({ userId, accountId: id })
                .andWhereBetween('date', [fromConverted, toConverted])
                .sum({
                    source_total: this.db.engine().raw('source_total'),
                    target_total: this.db.engine().raw('target_total'),
                })
                .first();
            const source_total = result?.source_total || 0;
            const target_total = result?.target_total || 0;
            this._logger.info(`Successfully fetched summary for userId: ${userId}, accountId: ${id}`);
            return { id, source_total, target_total };
        } catch (e) {
            this._logger.error(
                `Failed to fetch summary for userId: ${userId}, accountId: ${id}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Failed to fetch summary due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }
}
