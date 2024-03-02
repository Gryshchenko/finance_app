import { IAccount } from 'interfaces/IAccount';
import { ICreateAccount } from 'interfaces/ICreateAccount';

export interface IAccountDataAccess {
    createAccounts(userId: number, accounts: ICreateAccount[]): Promise<IAccount[]>;
}