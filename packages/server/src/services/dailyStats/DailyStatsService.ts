import { DateFormat, ISummary, StatsPeriod, Time } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IDailyStatsDataAccess } from 'services/dailyStats/DailyStatsDataAccess';
import { statsValidateDate } from 'src/utils/validation/StatsValidateDate';
import { StatsTransactionType } from 'types/StatsTransactionType';

export interface IDailyStatsService {
    summary(userId: number, from: string, to: string, period: StatsPeriod): Promise<ISummary>;
    addToScore: (
        userId: number,
        date: string,
        income_total: number,
        expense_total: number,
        transfer_total: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
    subtractFromScore: (
        userId: number,
        date: string,
        income_total: number,
        expense_total: number,
        transfer_total: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
    updateTotal: (
        userId: number,
        date: string,
        category: StatsTransactionType,
        amount: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
}

export default class DailyStatsService extends LoggerBase implements IDailyStatsService {
    private readonly _dailyStatsDataAccess: IDailyStatsDataAccess;

    public constructor(dailyStatsDataAccess: IDailyStatsDataAccess) {
        super();
        this._dailyStatsDataAccess = dailyStatsDataAccess;
    }

    public async updateTotal(
        userId: number,
        date: string,
        category: StatsTransactionType,
        amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return await this._dailyStatsDataAccess.updateTotal(userId, day, category, amount, trx);
    }
    public async addToScore(
        userId: number,
        date: string,
        income_total: number,
        expense_total: number,
        transfer_total: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return await this._dailyStatsDataAccess.addToScore(userId, day, income_total, expense_total, transfer_total, trx);
    }
    public async subtractFromScore(
        userId: number,
        date: string,
        income_total: number,
        expense_total: number,
        transfer_total: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return await this._dailyStatsDataAccess.subtractFromScore(userId, day, income_total, expense_total, transfer_total, trx);
    }
    public async summary(userId: number, from: string, to: string, period: StatsPeriod): Promise<ISummary> {
        const dayFrom: string = statsValidateDate(from);
        const datTo: string = statsValidateDate(to);
        return await this._dailyStatsDataAccess.summary(
            userId,
            Time.formatUTCDate(dayFrom, DateFormat.YYYY_MM_dd),
            Time.formatUTCDate(datTo, DateFormat.YYYY_MM_dd),
            period,
        );
    }
}
