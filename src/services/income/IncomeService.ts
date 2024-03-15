import { IIncomeDataAccess } from 'interfaces/IIncomeDataAccess';
import { IIncomeService } from 'interfaces/IIncomeService';
import { IIncome } from 'interfaces/IIncome';
import { ICreateIncome } from 'interfaces/ICreateIncome';

module.exports = class IncomeService implements IIncomeService {
    private _accountDataAccess: IIncomeDataAccess;
    public constructor(accountDataAccess: IIncomeDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }

    public async createIncomes(userId: number, incomes: ICreateIncome[]): Promise<IIncome[]> {
        return await this._accountDataAccess.createIncomes(userId, incomes);
    }
};
