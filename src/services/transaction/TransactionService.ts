import { ITransactionService } from 'interfaces/ITransactionService';
import { ICreateTransaction } from 'interfaces/ICreateTransaction';
import { ITransactionDataAccess } from 'interfaces/ITransactionDataAccess';
import { ITransaction } from 'interfaces/ITransaction';

export default class TransactionService implements ITransactionService {
    private readonly _transactionDataAccess: ITransactionDataAccess;

    public constructor(TransactionDataAccess: ITransactionDataAccess) {
        this._transactionDataAccess = TransactionDataAccess;
    }

    async createTransaction(transaction: ICreateTransaction): Promise<number> {
        return await this._transactionDataAccess.createTransaction(transaction);
    }
    async getTransaction(userId: number, transactionId: number): Promise<ITransaction | undefined> {
        return await this._transactionDataAccess.getTransaction(userId, transactionId);
    }
    async getTransactions(userId: number): Promise<ITransaction[] | undefined> {
        return await this._transactionDataAccess.getTransactions(userId);
    }
}
