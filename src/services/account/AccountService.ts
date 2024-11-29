import { IAccountDataAccess } from 'interfaces/IAccountDataAccess';
import { IAccountService } from 'interfaces/IAccountService';
import { IAccount } from 'interfaces/IAccount';
import { ICreateAccount } from 'interfaces/ICreateAccount';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export default class AccountService implements IAccountService {
    private readonly _accountDataAccess: IAccountDataAccess;

    public constructor(accountDataAccess: IAccountDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }

    async createAccounts(userId: number, accounts: ICreateAccount[], trx?: IDBTransaction): Promise<IAccount[]> {
        return await this._accountDataAccess.createAccounts(userId, accounts, trx);
    }
    async getAccount(userId: number, accountId: number): Promise<IAccount | undefined> {
        return await this._accountDataAccess.getAccount(userId, accountId);
    }
    async getAccounts(userId: number): Promise<IAccount[] | undefined> {
        return await this._accountDataAccess.getAccounts(userId);
    }
}
