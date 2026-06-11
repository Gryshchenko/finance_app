import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDailyIncomeStatsDataAccess, IDailyIncomeStatsScoreParams } from 'services/dailyIncomeStats/DailyIncomeStatsDataAccess';
import { statsValidateDate } from 'src/utils/validation/StatsValidateDate';

export interface IDailyIncomeStatsService {
    addToScore: (params: IDailyIncomeStatsScoreParams) => Promise<boolean>;
    subtractFromScore: (params: IDailyIncomeStatsScoreParams) => Promise<boolean>;
    updateTotal(params: IDailyIncomeStatsScoreParams): Promise<boolean>;
    summary: (userId: number, id: number, from: string, to: string) => Promise<{ id: number; total: number }>;
}

export class DailyIncomeStatsService extends LoggerBase implements IDailyIncomeStatsService {
    constructor(private readonly dataAccess: IDailyIncomeStatsDataAccess) {
        super();
    }

    async summary(userId: number, id: number, from: string, to: string): Promise<{ id: number; total: number }> {
        const fromDate: string = statsValidateDate(from);
        const toDate: string = statsValidateDate(to);
        return this.dataAccess.summary(userId, id, fromDate, toDate);
    }

    async updateTotal(params: IDailyIncomeStatsScoreParams): Promise<boolean> {
        return this.dataAccess.updateTotal({ ...params, date: statsValidateDate(params.date) });
    }

    public async addToScore(params: IDailyIncomeStatsScoreParams): Promise<boolean> {
        return this.dataAccess.addToScore({ ...params, date: statsValidateDate(params.date) });
    }

    public async subtractFromScore(params: IDailyIncomeStatsScoreParams): Promise<boolean> {
        return this.dataAccess.subtractFromScore({ ...params, date: statsValidateDate(params.date) });
    }
}
