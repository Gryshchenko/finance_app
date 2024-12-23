import { ITransactionService } from 'interfaces/ITransactionService';
import { ICreateTransaction } from 'interfaces/ICreateTransaction';
import { ITransactionDataAccess } from 'interfaces/ITransactionDataAccess';
import { ITransaction } from 'interfaces/ITransaction';
import { TransactionType } from 'types/TransactionType';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
// import { ICategoryService } from 'interfaces/ICategoryService';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { ErrorCode } from 'types/ErrorCode';
import Utils from 'src/utils/Utils';
import { CustomError } from 'src/utils/errors/CustomError';
import { HttpCode } from 'types/HttpCode';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'helper/logger/LoggerBase';
import { IAccountService } from 'interfaces/IAccountService';
import { IAccount } from 'interfaces/IAccount';

export default class TransactionService extends LoggerBase implements ITransactionService {
    private readonly _transactionDataAccess: ITransactionDataAccess;
    // private readonly _categoryService: ICategoryService;
    private readonly _accountService: IAccountService;
    private readonly _db: IDatabaseConnection;

    public constructor(
        transactionDataAccess: ITransactionDataAccess,
        // categoryService: ICategoryService,
        accountService: IAccountService,
        db: IDatabaseConnection,
    ) {
        super();
        this._transactionDataAccess = transactionDataAccess;
        // this._categoryService = categoryService;
        this._accountService = accountService;
        this._db = db;
    }

    async createTransaction(transaction: ICreateTransaction): Promise<number | null> {
        switch (transaction.transactionTypeId) {
            case TransactionType.Expense: {
                return this.createExpenseTransaction(transaction);
            }
            case TransactionType.Income: {
                return this.createIncomeTransaction(transaction);
            }
            case TransactionType.Transafer: {
                return this.createTransfareTransaction(transaction);
            }
            default: {
                return null;
            }
        }
    }

    async getTransaction(userId: number, transactionId: number): Promise<ITransaction | undefined> {
        return await this._transactionDataAccess.getTransaction(userId, transactionId);
    }
    async getTransactions(userId: number): Promise<ITransaction[] | undefined> {
        return await this._transactionDataAccess.getTransactions(userId);
    }
    private async createIncomeTransaction(transaction: ICreateTransaction): Promise<number> {
        return this.processTransaction(
            transaction,
            async ({ transactionAmount, accountId, userId, trx }) => {
                const accountInWork = await this._accountService.getAccount(userId, accountId as number);

                this.validateAccount(accountInWork);

                const currentAmount = (accountInWork as IAccount).amount;
                const newAmount = Utils.roundNumber(currentAmount) + Utils.roundNumber(transactionAmount);

                await this._accountService.patchAccount(userId, accountId as number, { amount: newAmount }, trx);
            },
            'income',
        );
    }

    private async createExpenseTransaction(transaction: ICreateTransaction): Promise<number> {
        return this.processTransaction(
            transaction,
            async ({ transactionAmount, accountId, userId, trx }) => {
                const accountInWork = await this._accountService.getAccount(userId, accountId as number);

                this.validateAccount(accountInWork);

                const currentAmount = (accountInWork as IAccount).amount;
                const newAmount = Utils.roundNumber(currentAmount) - Utils.roundNumber(transactionAmount);
                await this._accountService.patchAccount(userId, accountId as number, { amount: newAmount }, trx);
            },
            'expense',
        );
    }

    private async createTransfareTransaction(transaction: ICreateTransaction): Promise<number> {
        return this.processTransaction(
            transaction,
            async ({ transactionAmount, accountId, userId, trx, targetAccountId }) => {
                if (!targetAccountId) {
                    throw new ValidationError({
                        message: 'Target account is required for transfer transaction',
                        errorCode: ErrorCode.TARGET_ACCOUNT_ID_ERROR,
                    });
                }

                const sourceAccount = await this._accountService.getAccount(userId, accountId);
                const targetAccount = await this._accountService.getAccount(userId, targetAccountId);

                this.validateAccount(sourceAccount);
                this.validateAccount(targetAccount);

                const newSourceAmount =
                    Utils.roundNumber((sourceAccount as IAccount).amount) - Utils.roundNumber(transactionAmount);
                const newTargetAmount =
                    Utils.roundNumber((targetAccount as IAccount).amount) + Utils.roundNumber(transactionAmount);

                await this._accountService.patchAccount(userId, accountId, { amount: newSourceAmount }, trx);
                await this._accountService.patchAccount(userId, targetAccountId, { amount: newTargetAmount }, trx);
            },
            'transfare',
        );
    }

    private async processTransaction(
        transaction: ICreateTransaction,
        operation: ({
            transactionAmount,
            trx,
            accountId,
            userId,
            targetAccountId,
            currencyId,
        }: {
            currencyId?: number;
            transactionAmount: number;
            trx: IDBTransaction;
            accountId: number;
            userId: number;
            targetAccountId?: number;
        }) => Promise<void>,
        transactionType: 'income' | 'expense' | 'transfare',
    ): Promise<number> {
        const uow = new UnitOfWork(this._db);
        try {
            const { amount, userId, targetAccountId, accountId, currencyId } = transaction;
            await uow.start();

            const trxInProcess = uow.getTransaction();
            this.validateTrx(trxInProcess);

            const trx = trxInProcess as IDBTransaction;

            await operation({
                transactionAmount: Math.abs(amount),
                accountId,
                userId,
                targetAccountId,
                currencyId,
                trx,
            });

            const transactionId = await this._transactionDataAccess.createTransaction(transaction, trx);

            await uow.commit();

            return transactionId;
        } catch (e) {
            this._logger.error(
                `Transaction ${transactionType} failed for userId=${transaction.userId}, accountId=${transaction.accountId}: ${(e as { message: string }).message}`,
                e,
            );
            await uow.rollback();
            throw e;
        }
    }

    private validateAccount(account: IAccount | undefined): void {
        const error = (reason: string) => {
            throw new ValidationError({
                message: `Creating expense transaction failed, due reason ${reason}`,
                errorCode: ErrorCode.TRANSACTION_ERROR,
            });
        };
        if (Utils.isNull(account) || Utils.isNull(account?.amount) || Utils.isNull(account?.currencyId)) {
            error('account = null');
        }
        const { amount, currencyId } = account as IAccount;
        if (Utils.isNull(currencyId)) {
            error('currencyId = null');
        }
        if (Utils.isNull(amount)) {
            error('amount= null');
        }
    }

    private validateTrx(trxInProcess: IDBTransaction | null): void {
        if (Utils.isNull(trxInProcess)) {
            throw new CustomError({
                message: 'Transaction not initiated. User could not be created',
                errorCode: ErrorCode.SIGNUP_TRANSACTION,
                statusCode: HttpCode.INTERNAL_SERVER_ERROR,
            });
        }
    }
}
