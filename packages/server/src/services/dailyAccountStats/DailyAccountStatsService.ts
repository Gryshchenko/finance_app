import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IDailyAccountStatsDataAccess } from 'services/dailyAccountStats/DailyAccountStatsDataAccess';
import { statsValidateDate } from 'src/utils/validation/StatsValidateDate';
import { StatsTransactionType } from 'types/StatsTransactionType';

export interface IDailyAccountStatsService {
    updateTotal(
        userId: number,
        date: string,
        accountId: number,
        type: StatsTransactionType,
        amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean>;
    addToScore: (
        userId: number,
        date: string,
        income_amount: number,
        expanse_amount: number,
        accountId: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
    subtractFromScore: (
        userId: number,
        date: string,
        income_amount: number,
        expanse_amount: number,
        accountId: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
}

export class DailyAccountStatsService extends LoggerBase implements IDailyAccountStatsService {
    constructor(private readonly dataAccess: IDailyAccountStatsDataAccess) {
        super();
    }

    async updateTotal(
        userId: number,
        date: string,
        accountId: number,
        type: StatsTransactionType,
        amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.updateTotal(userId, day, accountId, type, amount, trx);
    }
    public async addToScore(
        userId: number,
        date: string,
        income_amount: number,
        expanse_amount: number,
        accountId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.addToScore(userId, day, income_amount, expanse_amount, accountId, trx);
    }

    public async subtractFromScore(
        userId: number,
        date: string,
        income_amount: number,
        expanse_amount: number,
        accountId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.subtractFromScore(userId, day, income_amount, expanse_amount, accountId, trx);
    }
}
