import { Time, ErrorCode } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { DBError } from 'src/utils/errors/DBError';
import { StatsTransactionType } from 'types/StatsTransactionType';

export interface IDailyAccountStatsDataAccess {
    updateTotal(
        userId: number,
        date: string,
        accountId: number,
        type: StatsTransactionType,
        amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean>;
    addToScore: (
        userId: number,
        date: string,
        income_amount: number,
        expanse_amount: number,
        accountId: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
    subtractFromScore: (
        userId: number,
        date: string,
        income_amount: number,
        expanse_amount: number,
        accountId: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
    summary: (
        userId: number,
        id: number,
        from: string,
        to: string,
    ) => Promise<{ id: number; totalIncome: number; totalExpanse: number }>;
}

export class DailyAccountStatsDataAccess extends LoggerBase implements IDailyAccountStatsDataAccess {
    constructor(private readonly _db: IDatabaseConnection) {
        super();
    }

    async summary(
        userId: number,
        id: number,
        from: string,
        to: string,
    ): Promise<{ id: number; totalIncome: number; totalExpanse: number }> {
        try {
            const fromConverted = Time.toUTCISO(from);
            const toConverted = Time.toUTCISO(to);
            this._logger.info(
                `Fetching summary for userId: ${userId}, accountId: ${id}, from: ${fromConverted}, to: ${toConverted}`,
            );
            const result = await this._db
                .engine()('daily_accounts_stats')
                .where({ userId, accountId: id })
                .andWhereBetween('date', [fromConverted, toConverted])
                .sum({ totalIncome: this._db.engine().raw('income_total'), totalExpanse: this._db.engine().raw('expense_total') })
                .first();
            const totalIncome = result?.totalIncome || 0;
            const totalExpanse = result?.totalExpanse || 0;
            this._logger.info(`Successfully fetched summary for userId: ${userId}, accountId: ${id}`);
            return { id, totalIncome, totalExpanse };
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

    public async addToScore(
        userId: number,
        date: string,
        income_total: number,
        expense_total: number,
        accountId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        try {
            this._logger.info(`AddToScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            const updatedAt = Time.getISODateNowUTC();
            await query('daily_accounts_stats')
                .insert({
                    userId,
                    date,
                    income_total,
                    expense_total,
                    accountId,
                    updatedAt,
                })
                .onConflict(['userId', 'date', 'accountId'])
                .merge({
                    income_total: query.raw('daily_accounts_stats.income_total + ?', [income_total]),
                    expense_total: query.raw('daily_accounts_stats.expense_total + ?', [expense_total]),
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

    public async subtractFromScore(
        userId: number,
        date: string,
        income_total: number,
        expense_total: number,
        accountId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        try {
            this._logger.info(`SubtractFromScore daily stats userId: ${userId}, for date: ${date}`);
            const query = trx || this._db.engine();
            const updatedAt = Time.getISODateNowUTC();
            await query('daily_accounts_stats')
                .insert({
                    userId,
                    date,
                    income_total,
                    expense_total,
                    accountId,
                    updatedAt,
                })
                .onConflict(['userId', 'date', 'accountId'])
                .merge({
                    income_total: query.raw('daily_accounts_stats.income_total - ?', [income_total]),
                    expense_total: query.raw('daily_accounts_stats.expense_total - ?', [expense_total]),
                    updatedAt,
                });
            this._logger.info(`Successfully subtractFromScore daily stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed subtractFromScore daily stats for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `subtractFromScore daily stats failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }

    async updateTotal(
        userId: number,
        date: string,
        accountId: number,
        type: StatsTransactionType,
        amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        try {
            const query = trx || this._db.engine();
            this._logger.info(`Starting update daily account stats userId: ${userId}, date: ${date}`);
            await query.raw(
                `
            INSERT INTO daily_accounts_stats (
                "userId", date, "accountId", income_total, expense_total
            )
            VALUES (
                ?, ?::date, ?,
                CASE WHEN ? = 'income' THEN ? ELSE 0::numeric END,
                CASE WHEN ? = 'expense' THEN ? ELSE 0::numeric END
            )
            ON CONFLICT ("userId", date, "accountId")
            DO UPDATE SET
                income_total  = daily_accounts_stats.income_total  + EXCLUDED.income_total,
                expense_total = daily_accounts_stats.expense_total + EXCLUDED.expense_total,
                "updatedAt" = NOW();
            `,
                [userId, date, accountId, type, amount, type, amount],
            );
            this._logger.info(`Successfully update daily account stats for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed update daily account stats for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Update daily account stats failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }
}
