import { ITransaction } from 'interfaces/ITransaction';
import { ICreateTransaction } from 'interfaces/ICreateTransaction';
import { IDBTransaction } from './IDatabaseConnection';

export interface ITransactionDataAccess {
    createTransaction(transaction: ICreateTransaction, trx?: IDBTransaction): Promise<number>;
    getTransactions(userId: number): Promise<ITransaction[] | undefined>;
    getTransaction(userId: number, transactionId: number): Promise<ITransaction | undefined>;
}
