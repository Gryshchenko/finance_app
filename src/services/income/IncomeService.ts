import { IIncomeDataAccess } from 'interfaces/IIncomeDataAccess';
import { IIncomeService } from 'interfaces/IIncomeService';
import { IIncome } from 'interfaces/IIncome';

module.exports = class IncomeService implements IIncomeService {
    private _accountDataAccess: IIncomeDataAccess;
    public constructor(accountDataAccess: IIncomeDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }

    public async createIncome(userId: number, incomeName: string[], currencyId: number): Promise<IIncome[]> {
        return await this._accountDataAccess.createIncome(userId, incomeName, currencyId);
    }
};
