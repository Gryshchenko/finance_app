import { IIncomeDataAccess } from 'interfaces/IIncomeDataAccess';
import { IIncomeService } from 'interfaces/IIncomeService';
import { IIncome } from 'interfaces/IIncome';
import { ICreateIncome } from 'interfaces/ICreateIncome';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export default class IncomeService implements IIncomeService {
    private _incomeDataAccess: IIncomeDataAccess;

    public constructor(accountDataAccess: IIncomeDataAccess) {
        this._incomeDataAccess = accountDataAccess;
    }

    public async createIncomes(userId: number, incomes: ICreateIncome[], trx?: IDBTransaction): Promise<IIncome[]> {
        return await this._incomeDataAccess.createIncomes(userId, incomes, trx);
    }
    async getIncome(userId: number, accountId: number): Promise<IIncome | undefined> {
        return await this._incomeDataAccess.getIncome(userId, accountId);
    }
    async getIncomes(userId: number): Promise<IIncome[] | undefined> {
        return await this._incomeDataAccess.getIncomes(userId);
    }
}
