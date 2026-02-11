import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IBalance } from '../../../shared/src/interfaces/IBalance';

export interface IBalanceDataAccess {
    get(userId: number): Promise<IBalance>;
    patch(userId: number, properties: { amount: number }, trx?: IDBTransaction): Promise<number>;
    post(userId: number, properties: { amount: number; currencyCode: string }, trx?: IDBTransaction): Promise<number>;
}
