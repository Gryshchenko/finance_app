import { DateFormat, Time } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import {
    IDailyTransferStatsDataAccess,
    IDailyTransferStatsUpdateTotalParams,
} from 'services/dailyTransferStats/DailyTransferStatsDataAccess';

export interface IDailyTransferStatsService {
    updateTotal(params: IDailyTransferStatsUpdateTotalParams): Promise<boolean>;
    summary: (
        userId: number,
        id: number,
        from: string,
        to: string,
    ) => Promise<{ id: number; source_total: number; target_total: number }>;
}

export class DailyTransferStatsService extends LoggerBase implements IDailyTransferStatsService {
    constructor(private readonly dataAccess: IDailyTransferStatsDataAccess) {
        super();
    }

    async updateTotal(params: IDailyTransferStatsUpdateTotalParams): Promise<boolean> {
        return this.dataAccess.updateTotal({
            ...params,
            date: Time.formatUTCDate(params.date, DateFormat.YYYY_MM_DD),
        });
    }
    async summary(
        userId: number,
        id: number,
        from: string,
        to: string,
    ): Promise<{ id: number; source_total: number; target_total: number }> {
        const fromDate: string = Time.formatUTCDate(from, DateFormat.YYYY_MM_DD);
        const toDate: string = Time.formatUTCDate(to, DateFormat.YYYY_MM_DD);
        return this.dataAccess.summary(userId, id, fromDate, toDate);
    }
}
