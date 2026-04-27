import { DateFormat, Time } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IDailyTransferStatsDataAccess } from 'services/dailyTransferStats/DailyTransferStatsDataAccess';

export interface IDailyTransferStatsService {
    updateTotal(
        userId: number,
        date: string,
        accountId: number,
        targetAccountId: number,
        amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean>;
}

export class DailyTransferStatsService extends LoggerBase implements IDailyTransferStatsService {
    constructor(private readonly dataAccess: IDailyTransferStatsDataAccess) {
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
        const day = Time.formatUTCDate(date, DateFormat.YYYY_MM_DD);
        return this.dataAccess.updateTotal(userId, day, accountId, targetAccountId, amount, trx);
    }
}
