import { IAccount } from 'interfaces/IAccount';
import { ICreateAccount } from 'interfaces/ICreateAccount';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export interface IAccountService {
    createAccounts(userId: number, accounts: ICreateAccount[], trx?: IDBTransaction): Promise<IAccount[]>;
    getAccounts(userId: number): Promise<IAccount[] | undefined>;
    getAccount(userId: number, accountId: number): Promise<IAccount | undefined>;
    patchAccount(userId: number, accountId: number, properties: Partial<IAccount>, trx?: IDBTransaction): Promise<number>;
}
