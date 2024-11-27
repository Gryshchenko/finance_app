import { ITransactionService } from 'interfaces/ITransactionService';
import { ICreateTransaction } from 'interfaces/ICreateTransaction';
import { ITransactionDataAccess } from 'interfaces/ITransactionDataAccess';
import { ITransaction } from 'interfaces/ITransaction';

export default class TransactionService implements ITransactionService {
    private _TransactionDataAccess: ITransactionDataAccess;

    public constructor(TransactionDataAccess: ITransactionDataAccess) {
        this._TransactionDataAccess = TransactionDataAccess;
    }

    async createTransaction(transaction: ICreateTransaction): Promise<number> {
        return await this._TransactionDataAccess.createTransaction(transaction);
    }
    async getTransaction(userId: number, transactionId: number): Promise<ITransaction | undefined> {
        return await this._TransactionDataAccess.getTransaction(userId, transactionId);
    }
    async getTransactions(userId: number): Promise<ITransaction[] | undefined> {
        return await this._TransactionDataAccess.getTransactions(userId);
    }
}
