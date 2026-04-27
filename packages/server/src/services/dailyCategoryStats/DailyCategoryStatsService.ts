import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IDailyCategoryStatsDataAccess } from 'services/dailyCategoryStats/DailyCategoryStatsDataAccess';
import { statsValidateDate } from 'src/utils/validation/StatsValidateDate';

export interface IDailyCategoryStatsService {
    updateTotal(userId: number, date: string, categoryId: number, amount: number, trx?: IDBTransaction): Promise<boolean>;
    addToScore: (userId: number, date: string, amount: number, categoryId: number, trx?: IDBTransaction) => Promise<boolean>;
    subtractFromScore: (
        userId: number,
        date: string,
        amount: number,
        categoryId: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
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

    async updateTotal(userId: number, date: string, categoryId: number, amount: number, trx?: IDBTransaction): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.updateTotal(userId, day, categoryId, amount, trx);
    }
    public async addToScore(
        userId: number,
        date: string,
        amount: number,
        categoryId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.addToScore(userId, day, amount, categoryId, trx);
    }

    public async subtractFromScore(
        userId: number,
        date: string,
        amount: number,
        categoryId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.subtractFromScore(userId, day, amount, categoryId, trx);
    }
}
