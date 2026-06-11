import { LoggerBase } from 'helper/logger/LoggerBase';
import {
    IDailyAccountStatsDataAccess,
    IDailyAccountStatsScoreParams,
} from 'services/dailyAccountStats/DailyAccountStatsDataAccess';
import { statsValidateDate } from 'src/utils/validation/StatsValidateDate';

export interface IDailyAccountStatsService {
    updateTotal(params: IDailyAccountStatsScoreParams): Promise<boolean>;
    addToScore: (params: IDailyAccountStatsScoreParams) => Promise<boolean>;
    subtractFromScore: (params: IDailyAccountStatsScoreParams) => Promise<boolean>;
    summary: (
        userId: number,
        id: number,
        from: string,
        to: string,
    ) => Promise<{ id: number; totalIncome: number; totalExpanse: number }>;
}

export class DailyAccountStatsService extends LoggerBase implements IDailyAccountStatsService {
    constructor(private readonly dataAccess: IDailyAccountStatsDataAccess) {
        super();
    }
    async summary(
        userId: number,
        id: number,
        from: string,
        to: string,
    ): Promise<{ id: number; totalIncome: number; totalExpanse: number }> {
        const fromDate: string = statsValidateDate(from);
        const toDate: string = statsValidateDate(to);
        return this.dataAccess.summary(userId, id, fromDate, toDate);
    }

    async updateTotal(params: IDailyAccountStatsScoreParams): Promise<boolean> {
        return this.dataAccess.updateTotal({ ...params, date: statsValidateDate(params.date) });
    }

    public async addToScore(params: IDailyAccountStatsScoreParams): Promise<boolean> {
        return this.dataAccess.addToScore({ ...params, date: statsValidateDate(params.date) });
    }

    public async subtractFromScore(params: IDailyAccountStatsScoreParams): Promise<boolean> {
        return this.dataAccess.subtractFromScore({ ...params, date: statsValidateDate(params.date) });
    }
}
