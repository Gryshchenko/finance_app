import { IAccount } from 'interfaces/IAccount';
import { ICreateAccount } from 'interfaces/ICreateAccount';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface IAccountService {
    createAccounts(userId: number, accounts: ICreateAccount[], trx?: ITransaction): Promise<IAccount[]>;
}
