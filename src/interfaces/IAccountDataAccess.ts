import { IAccount } from 'interfaces/IAccount';
import { ICreateAccount } from 'interfaces/ICreateAccount';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface IAccountDataAccess {
    createAccounts(userId: number, accounts: ICreateAccount[], trx?: ITransaction): Promise<IAccount[]>;
    getAccounts(userId: number): Promise<IAccount[] | undefined>;
    getAccount(userId: number, accountId: number): Promise<IAccount | undefined>;
}
