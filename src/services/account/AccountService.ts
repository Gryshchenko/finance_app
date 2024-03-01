import { IAccountDataAccess } from 'interfaces/IAccountDataAccess';
import { IAccountService } from 'interfaces/IAccountService';

module.exports = class AccountService implements IAccountService {
    private _accountDataAccess: IAccountDataAccess;
    public constructor(accountDataAccess: IAccountDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }
};
