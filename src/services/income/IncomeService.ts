import { IIncomeDataAccess } from 'interfaces/IIncomeDataAccess';
import { IIncomeService } from 'interfaces/IIncomeService';
import { IIncome } from 'interfaces/IIncome';
import { ICreateIncome } from 'interfaces/ICreateIncome';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export default class IncomeService implements IIncomeService {
    private _accountDataAccess: IIncomeDataAccess;

    public constructor(accountDataAccess: IIncomeDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }

    public async createIncomes(userId: number, incomes: ICreateIncome[], trx?: ITransaction): Promise<IIncome[]> {
        return await this._accountDataAccess.createIncomes(userId, incomes, trx);
    }
}
