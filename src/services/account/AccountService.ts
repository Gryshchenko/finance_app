import { IAccountDataAccess } from 'interfaces/IAccountDataAccess';
import { IAccountService } from 'interfaces/IAccountService';
import { IAccount } from 'interfaces/IAccount';
import { ICreateAccount } from 'interfaces/ICreateAccount';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export default class AccountService implements IAccountService {
    private _accountDataAccess: IAccountDataAccess;

    public constructor(accountDataAccess: IAccountDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }

    async createAccounts(userId: number, accounts: ICreateAccount[], trx?: ITransaction): Promise<IAccount[]> {
        return await this._accountDataAccess.createAccounts(userId, accounts, trx);
    }
}
