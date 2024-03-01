import { IIncomeDataAccess } from 'interfaces/IIncomeDataAccess';
import { IIncomeService } from 'interfaces/IIncomeService';

module.exports = class IncomeService implements IIncomeService {
    private _accountDataAccess: IIncomeDataAccess;
    public constructor(accountDataAccess: IIncomeDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }
};
