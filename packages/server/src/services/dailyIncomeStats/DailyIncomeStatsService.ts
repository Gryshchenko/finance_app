import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IDailyIncomeStatsDataAccess } from 'services/dailyIncomeStats/DailyIncomeStatsDataAccess';
import { statsValidateDate } from 'src/utils/validation/StatsValidateDate';

export interface IDailyIncomeStatsService {
    addToScore: (userId: number, date: string, amount: number, incomeId: number, trx?: IDBTransaction) => Promise<boolean>;
    subtractFromScore: (userId: number, date: string, amount: number, incomeId: number, trx?: IDBTransaction) => Promise<boolean>;
    updateTotal(userId: number, date: string, incomeId: number, amount: number, trx?: IDBTransaction): Promise<boolean>;
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

    async updateTotal(userId: number, date: string, incomeId: number, amount: number, trx?: IDBTransaction): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.updateTotal(userId, day, incomeId, amount, trx);
    }
    public async addToScore(
        userId: number,
        date: string,
        amount: number,
        incomeId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.addToScore(userId, day, amount, incomeId, trx);
    }

    public async subtractFromScore(
        userId: number,
        date: string,
        amount: number,
        incomeId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.subtractFromScore(userId, day, amount, incomeId, trx);
    }
}
