import { LoggerBase } from 'helper/logger/LoggerBase';
import {
    IDailyCategoryStatsDataAccess,
    IDailyCategoryStatsScoreParams,
} from 'services/dailyCategoryStats/DailyCategoryStatsDataAccess';
import { statsValidateDate } from 'src/utils/validation/StatsValidateDate';

export interface IDailyCategoryStatsService {
    updateTotal(params: IDailyCategoryStatsScoreParams): Promise<boolean>;
    addToScore: (params: IDailyCategoryStatsScoreParams) => Promise<boolean>;
    subtractFromScore: (params: IDailyCategoryStatsScoreParams) => Promise<boolean>;
    summary: (userId: number, id: number, from: string, to: string) => Promise<{ id: number; total: number }>;
}

export class DailyCategoryStatsService extends LoggerBase implements IDailyCategoryStatsService {
    constructor(private readonly dataAccess: IDailyCategoryStatsDataAccess) {
        super();
    }
    async summary(userId: number, id: number, from: string, to: string): Promise<{ id: number; total: number }> {
        const fromDate: string = statsValidateDate(from);
        const toDate: string = statsValidateDate(to);
        return this.dataAccess.summary(userId, id, fromDate, toDate);
    }

    async updateTotal(params: IDailyCategoryStatsScoreParams): Promise<boolean> {
        return this.dataAccess.updateTotal({ ...params, date: statsValidateDate(params.date) });
    }

    public async addToScore(params: IDailyCategoryStatsScoreParams): Promise<boolean> {
        return this.dataAccess.addToScore({ ...params, date: statsValidateDate(params.date) });
    }

    public async subtractFromScore(params: IDailyCategoryStatsScoreParams): Promise<boolean> {
        return this.dataAccess.subtractFromScore({ ...params, date: statsValidateDate(params.date) });
    }
}
