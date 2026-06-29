import { DateFormat, StatsPeriod, Time } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { ISummary } from 'interfaces/ISummary';
import {
    IDailyStatsDataAccess,
    IDailyStatsScoreParams,
    IDailyStatsUpdateTotalParams,
} from 'services/dailyStats/DailyStatsDataAccess';
import { statsValidateDate } from 'src/utils/validation/StatsValidateDate';

export interface IDailyStatsService {
    summary(userId: number, from: string, to: string, period: StatsPeriod): Promise<ISummary>;
    addToScore: (params: IDailyStatsScoreParams) => Promise<boolean>;
    subtractFromScore: (params: IDailyStatsScoreParams) => Promise<boolean>;
    updateTotal: (params: IDailyStatsUpdateTotalParams) => Promise<boolean>;
}

export default class DailyStatsService extends LoggerBase implements IDailyStatsService {
    private readonly _dailyStatsDataAccess: IDailyStatsDataAccess;

    public constructor(dailyStatsDataAccess: IDailyStatsDataAccess) {
        super();
        this._dailyStatsDataAccess = dailyStatsDataAccess;
    }

    public async updateTotal(params: IDailyStatsUpdateTotalParams): Promise<boolean> {
        return await this._dailyStatsDataAccess.updateTotal({ ...params, date: statsValidateDate(params.date) });
    }

    public async addToScore(params: IDailyStatsScoreParams): Promise<boolean> {
        return await this._dailyStatsDataAccess.addToScore({ ...params, date: statsValidateDate(params.date) });
    }

    public async subtractFromScore(params: IDailyStatsScoreParams): Promise<boolean> {
        return await this._dailyStatsDataAccess.subtractFromScore({ ...params, date: statsValidateDate(params.date) });
    }

    public async summary(userId: number, from: string, to: string, period: StatsPeriod): Promise<ISummary> {
        const dayFrom: string = statsValidateDate(from);
        const datTo: string = statsValidateDate(to);
        return await this._dailyStatsDataAccess.summary(
            userId,
            Time.formatUTCDate(dayFrom, DateFormat.YYYY_MM_DD),
            Time.formatUTCDate(datTo, DateFormat.YYYY_MM_DD),
            period,
        );
    }
}
