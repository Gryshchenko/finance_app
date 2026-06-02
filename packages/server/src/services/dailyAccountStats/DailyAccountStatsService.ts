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
        source_amount: number,
        target_amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean>;
    addToScore: (
        userId: number,
        date: string,
        income_source_amount: number,
        income_target_amount: number,
        expanse_source_amount: number,
        expanse_target_amount: number,
        accountId: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
    subtractFromScore: (
        userId: number,
        date: string,
        income_source_amount: number,
        income_target_amount: number,
        expanse_source_amount: number,
        expanse_target_amount: number,
        accountId: number,
        trx?: IDBTransaction,
    ) => Promise<boolean>;
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

    async updateTotal(
        userId: number,
        date: string,
        accountId: number,
        type: StatsTransactionType,
        source_amount: number,
        target_amount: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.updateTotal(userId, day, accountId, type, source_amount, target_amount, trx);
    }
    public async addToScore(
        userId: number,
        date: string,
        income_source_amount: number,
        income_target_amount: number,
        expanse_source_amount: number,
        expanse_target_amount: number,
        accountId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.addToScore(
            userId,
            day,
            income_source_amount,
            income_target_amount,
            expanse_source_amount,
            expanse_target_amount,
            accountId,
            trx,
        );
    }

    public async subtractFromScore(
        userId: number,
        date: string,
        income_source_amount: number,
        income_target_amount: number,
        expanse_source_amount: number,
        expanse_target_amount: number,
        accountId: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        const day: string = statsValidateDate(date);
        return this.dataAccess.subtractFromScore(
            userId,
            day,
            income_source_amount,
            income_target_amount,
            expanse_source_amount,
            expanse_target_amount,
            accountId,
            trx,
        );
    }
}
