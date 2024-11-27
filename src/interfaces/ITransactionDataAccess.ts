import { ITransaction } from 'interfaces/ITransaction';
import { ICreateTransaction } from 'interfaces/ICreateTransaction';

export interface ITransactionDataAccess {
    createTransaction(transaction: ICreateTransaction): Promise<number>;
    getTransactions(userId: number): Promise<ITransaction[] | undefined>;
    getTransaction(userId: number, transactionId: number): Promise<ITransaction | undefined>;
}
