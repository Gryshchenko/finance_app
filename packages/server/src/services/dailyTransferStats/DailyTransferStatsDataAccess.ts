import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';

export interface IDailyTransferStatsDataAccess {
    updateTotal(
        userId: number,
        date: string,
        accountId: number,
        targetAccountId: number,
        amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean>;
}

export class DailyTransferStatsDataAccess extends LoggerBase implements IDailyTransferStatsDataAccess {
    constructor(private readonly db: IDatabaseConnection) {
        super();
    }

    async updateTotal(
        userId: number,
        date: string,
        accountId: number,
        targetAccountId: number,
        amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const query = trx || this.db.engine();

        await query.raw(
            `
            INSERT INTO daily_transfer_stats (
                "userId", date, "accountId", "targetAccountId", amount_total
            )
            VALUES (?, ?::date, ?, ?, ?)
            ON CONFLICT ("userId", "accountId", "targetAccountId", date)
            DO UPDATE SET
                amount_total = daily_transfer_stats.amount_total + EXCLUDED.amount_total,
                "updatedAt" = NOW();
            `,
            [userId, date, accountId, targetAccountId, amount],
        );

        return true;
    }
}
