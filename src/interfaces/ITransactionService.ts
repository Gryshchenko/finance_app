import { ITransaction } from 'interfaces/ITransaction';
import { ICreateTransaction } from 'interfaces/ICreateTransaction';

export interface ITransactionService {
    createTransaction(transactions: ICreateTransaction): Promise<number | null>;
    getTransactions(userId: number): Promise<ITransaction[] | undefined>;
    getTransaction(userId: number, transactionId: number): Promise<ITransaction | undefined>;
}
