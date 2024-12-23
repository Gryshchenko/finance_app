import { ITransactionDataAccess } from 'interfaces/ITransactionDataAccess';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ITransaction } from 'interfaces/ITransaction';
import { ICreateTransaction } from 'interfaces/ICreateTransaction';
import { DBError } from 'src/utils/errors/DBError';

export default class TransactionDataAccess extends LoggerBase implements ITransactionDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    async createTransaction(transaction: ICreateTransaction, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Starting transaction creation for userId: ${transaction.userId}`);

            const query = trx || this._db.engine();
            const data = await query('transactions').insert(
                {
                    accountId: transaction.accountId,
                    incomeId: transaction.incomeId,
                    categoryId: transaction.categoryId,
                    currencyId: transaction.currencyId,
                    transactionTypeId: transaction.transactionTypeId,
                    amount: transaction.amount,
                    description: transaction.description,
                    userId: transaction.userId,
                    createAt: transaction.createAt,
                    targetAccountId: transaction.targetAccountId,
                },
                ['transactionId'],
            );

            this._logger.info(`Successfully created ${data.length} transactions for userId: ${transaction.userId}`);
            return data[0].transactionId;
        } catch (e) {
            this._logger.error(
                `Failed to create transactions for userId: ${transaction.userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Transaction creation failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }

    async getTransactions(userId: number): Promise<ITransaction[] | undefined> {
        try {
            this._logger.info(`Fetching all transactions for userId: ${userId}`);

            const data = await this.getTransactionBaseQuery()
                .innerJoin('currencies', 'transactions.currencyId', 'currencies.currencyId')
                .where({ userId });

            if (!data.length) {
                this._logger.warn(`No transactions found for userId: ${userId}`);
            } else {
                this._logger.info(`Fetched ${data.length} transactions for userId: ${userId}`);
            }

            return data;
        } catch (e) {
            this._logger.error(
                `Failed to fetch transactions for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching transactions failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }

    async getTransaction(userId: number, transactionId: number): Promise<ITransaction | undefined> {
        try {
            this._logger.info(`Fetching transaction with transactionId: ${transactionId} for userId: ${userId}`);

            const data = await this.getTransactionBaseQuery().where({ userId, transactionId }).first();

            if (!data) {
                this._logger.warn(`Transaction with transactionId: ${transactionId} not found for userId: ${userId}`);
            } else {
                this._logger.info(`Fetched transaction with transactionId: ${transactionId} for userId: ${userId}`);
            }

            return data;
        } catch (e) {
            this._logger.error(
                `Failed to fetch transaction with transactionId: ${transactionId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching transaction failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }

    protected getTransactionBaseQuery() {
        return this._db
            .engine()('transactions')
            .select(
                'transactions.transactionId',
                'transactions.userId',
                'transactions.amount',
                'transactions.transactionName',
                'transactions.currencyId',
                'transactions.targetAccountId',
                'currencies.currencyCode',
                'currencies.currencyName',
                'currencies.symbol',
            );
    }
}
