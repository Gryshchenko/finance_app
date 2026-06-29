import {
    ErrorCode,
    HttpCode,
    IAccount,
    IPagination,
    ITransaction,
    ITransactionListItem,
    ITransactionListItemsRequest,
    Utils,
} from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { ICreateTransaction } from 'interfaces/ICreateTransaction';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IPatchTransaction } from 'interfaces/IPatchTransaction';
import { IAccountService } from 'services/account/AccountService';
import { IStatsOrchestratorService } from 'services/StatsOrchestrator/StatsOrchestratorService';
import { ITransactionDataAccess } from 'services/transaction/TransactionDataAccess';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { TransactionType } from 'types/TransactionType';

export interface ITransactionService {
    createTransaction(transactions: ICreateTransaction): Promise<number | null>;
    getTransactions({ userId, limit, cursor }: ITransactionListItemsRequest): Promise<IPagination<ITransactionListItem | null>>;
    getTransaction(userId: number, transactionId: number): Promise<ITransaction | undefined>;
    deleteTransaction(userId: number, transactionId: number): Promise<boolean>;
    patchTransaction(userId: number, transaction: IPatchTransaction): Promise<number | null>;
    deleteTransactionsForAccount(userId: number, accountId: number, trx?: IDBTransaction): Promise<boolean>;
}

export default class TransactionService extends LoggerBase implements ITransactionService {
    private readonly _transactionDataAccess: ITransactionDataAccess;
    private readonly _accountService: IAccountService;
    private readonly _statsOrchestratorService: IStatsOrchestratorService;
    private readonly _db: IDatabaseConnection;

    public constructor(
        transactionDataAccess: ITransactionDataAccess,
        accountService: IAccountService,
        statsOrchestratorService: IStatsOrchestratorService,
        db: IDatabaseConnection,
    ) {
        super();
        this._transactionDataAccess = transactionDataAccess;
        this._accountService = accountService;
        this._statsOrchestratorService = statsOrchestratorService;
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

    async deleteTransaction(userId: number, transactionId: number): Promise<boolean> {
        const uow = new UnitOfWork(this._db);
        try {
            await uow.start();
            const trxInProcess = uow.getTransaction();

            this.validateTrx(trxInProcess);

            const trx = trxInProcess as IDBTransaction;

            const trs = await this._transactionDataAccess.getTransaction(userId, transactionId, trx);
            const result = await this._transactionDataAccess.deleteTransaction(userId, transactionId, trx);
            if (!trs) {
                throw new ValidationError({
                    message: 'Transaction could not be deleted',
                });
            }
            switch (trs.transactionTypeId) {
                case TransactionType.Expense: {
                    await this._accountService.addAmount(userId, trs.accountId, trs.amount, trx);
                    await this._statsOrchestratorService.delete({
                        type: TransactionType.Expense,
                        userId,
                        data: {
                            date: trs.createdAt,
                            currencyCode: trs.currencyCode,
                            accountId: trs.accountId,
                            categoryId: trs.categoryId as number,
                            sourceAmount: trs.amount,
                            targetAmount: trs.targetAmount,
                        },
                        trx,
                    });
                    break;
                }
                case TransactionType.Income: {
                    await this._accountService.addAmount(userId, trs.accountId, -trs.amount, trx);
                    await this._statsOrchestratorService.delete({
                        type: TransactionType.Income,
                        userId,
                        data: {
                            date: trs.createdAt,
                            currencyCode: trs.currencyCode,
                            accountId: trs.accountId,
                            incomeId: trs.incomeId as number,
                            sourceAmount: trs.amount,
                            targetAmount: trs.targetAmount,
                        },
                        trx,
                    });
                    break;
                }
                case TransactionType.Transafer: {
                    await this._accountService.addAmount(userId, trs.accountId, trs.amount, trx);
                    await this._accountService.addAmount(userId, trs.targetAccountId as number, -trs.targetAmount, trx);
                    await this._statsOrchestratorService.delete({
                        type: TransactionType.Transafer,
                        userId,
                        data: {
                            date: trs.createdAt,
                            currencyCode: trs.currencyCode,
                            accountId: trs.accountId,
                            targetAccountId: trs.targetAccountId as number,
                            sourceAmount: trs.amount,
                            targetAmount: trs.targetAmount,
                        },
                        trx,
                    });
                    break;
                }
            }
            await uow.commit();
            return result;
        } catch (e) {
            this._logger.error(
                `Delete transaction failed for userId=${userId}, transactionId=${transactionId}: ${(e as { message: string }).message}`,
                e,
            );
            await uow.rollback();
            throw e;
        }
    }
    async patchTransaction(userId: number, transaction: IPatchTransaction): Promise<number | null> {
        const uow = new UnitOfWork(this._db);
        try {
            await uow.start();
            const trxInProcess = uow.getTransaction();
            this.validateTrx(trxInProcess);
            const trx = trxInProcess as IDBTransaction;

            const before = await this._transactionDataAccess.getTransaction(userId, transaction?.transactionId, trx);
            if (!before) {
                throw new ValidationError({
                    message: 'Transaction not found',
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                    statusCode: HttpCode.NOT_FOUND,
                });
            }

            const after: IPatchTransaction = {
                transactionId: transaction.transactionId,
                accountId: transaction.accountId ?? before.accountId,
                incomeId: transaction.incomeId ?? before.incomeId,
                categoryId: transaction.categoryId ?? (before.categoryId as number),
                amount: Utils.isNotNull(transaction.amount) ? transaction.amount : before.amount,
                description: transaction.description ?? before.description,
                createdAt: transaction.createdAt ?? before.createdAt,
                targetAccountId: transaction.targetAccountId ?? (before.targetAccountId as number),
                targetAmount: transaction.targetAmount ?? (before.targetAmount as number),
                targetCurrencyCode: transaction.targetCurrencyCode ?? (before.targetCurrencyCode as string),
            };

            // currency follows the account: a transaction sitting in a USD account is a USD transaction.
            // When the account changes, adopt the new account's currency (the amount value is kept as-is).
            after.currencyCode =
                after.accountId !== before.accountId
                    ? ((await this._accountService.getAccount(userId, after.accountId))?.currencyCode ?? before.currencyCode)
                    : before.currencyCode;

            await this.repatchAccounts(userId, before, after, trx);

            await this.repatchStats(userId, before, after, trx);

            const result = await this._transactionDataAccess.patchTransaction(userId, after, trx);

            await uow.commit();
            return result;
        } catch (e) {
            this._logger.error(
                `Patch transaction failed for userId=${userId}, transactionId=${transaction.transactionId}: ${(e as { message: string }).message}`,
                e,
            );
            await uow.rollback();
            throw e;
        }
    }

    private async repatchAccounts(
        userId: number,
        before: ITransaction,
        after: IPatchTransaction,
        trx: IDBTransaction,
    ): Promise<void> {
        switch (before.transactionTypeId) {
            case TransactionType.Income:
                // revert old income, apply new income
                await this._accountService.addAmount(userId, before.accountId, -before.amount, trx);
                await this._accountService.addAmount(userId, after.accountId, after.amount, trx);
                break;
            case TransactionType.Expense:
                // revert old expense (give money back), apply new expense (take money)
                await this._accountService.addAmount(userId, before.accountId, before.amount, trx);
                await this._accountService.addAmount(userId, after.accountId, -after.amount, trx);
                break;
            case TransactionType.Transafer:
                if (!before.targetAccountId) {
                    throw new ValidationError({
                        message: 'Before target account is required for transfer transaction',
                        errorCode: ErrorCode.ACCOUNT_ERROR,
                        payload: {
                            field: 'targetAccountId',
                            reason: 'validation:valueRequired',
                        },
                    });
                }
                if (!after.targetAccountId) {
                    throw new ValidationError({
                        message: 'After target account is required for transfer transaction',
                        errorCode: ErrorCode.ACCOUNT_ERROR,
                        payload: {
                            field: 'targetAccountId',
                            reason: 'validation:valueRequired',
                        },
                    });
                }
                // revert
                await this._accountService.addAmount(userId, before.accountId, before.amount, trx);
                await this._accountService.addAmount(userId, before.targetAccountId, -before.targetAmount, trx);
                // apply
                await this._accountService.addAmount(userId, after.accountId, -after.amount, trx);
                await this._accountService.addAmount(userId, after.targetAccountId, after.targetAmount, trx);
                break;
        }
    }

    private async repatchStats(
        userId: number,
        before: ITransaction,
        after: IPatchTransaction,
        trx: IDBTransaction,
    ): Promise<void> {
        const baseAfter = {
            accountId: after.accountId,
            date: after.createdAt,
            sourceAmount: after.amount,
            targetAmount: after.targetAmount,
            // currency follows the account (resolved in patchTransaction); falls back to the original
            currencyCode: after.currencyCode ?? before.currencyCode,
        };
        const baseBefore = {
            accountId: before.accountId,
            date: before.createdAt,
            sourceAmount: before.amount,
            targetAmount: before.targetAmount,
            currencyCode: before.currencyCode,
        };

        switch (before.transactionTypeId) {
            case TransactionType.Expense:
                await this._statsOrchestratorService.patch({
                    userId,
                    type: TransactionType.Expense,
                    after: { ...baseAfter, categoryId: after.categoryId as number },
                    before: { ...baseBefore, categoryId: before.categoryId as number },
                    trx,
                });
                break;
            case TransactionType.Income:
                await this._statsOrchestratorService.patch({
                    userId,
                    type: TransactionType.Income,
                    after: { ...baseAfter, incomeId: after.incomeId as number },
                    before: { ...baseBefore, incomeId: before.incomeId as number },
                    trx,
                });
                break;
            case TransactionType.Transafer:
                await this._statsOrchestratorService.patch({
                    userId,
                    type: TransactionType.Transafer,
                    after: { ...baseAfter, targetAccountId: after.targetAccountId as number },
                    before: { ...baseBefore, targetAccountId: before.targetAccountId as number },
                    trx,
                });
                break;
        }
    }
    async getTransaction(userId: number, transactionId: number): Promise<ITransaction | undefined> {
        return await this._transactionDataAccess.getTransaction(userId, transactionId);
    }
    async getTransactions(data: ITransactionListItemsRequest): Promise<IPagination<ITransactionListItem | null>> {
        return await this._transactionDataAccess.getTransactions(data);
    }
    private async createIncomeTransaction(transaction: ICreateTransaction): Promise<number> {
        return this.processTransaction(
            transaction,
            async ({ sourceAmount, accountId, userId, trx, targetAmount, targetCurrencyCode }) => {
                const accountInWork = await this._accountService.getAccount(userId, accountId as number);

                this.validateAccount(accountInWork);
                this.validateAccountCurrency(accountInWork as IAccount, targetCurrencyCode, 'accountId');
                await this._accountService.addAmount(userId, accountId as number, targetAmount, trx);
                await this._statsOrchestratorService.create({
                    type: TransactionType.Income,
                    userId,
                    data: {
                        sourceAmount,
                        targetAmount,
                        incomeId: transaction.incomeId as number,
                        accountId,
                        date: transaction.createdAt,
                        currencyCode: transaction.currencyCode,
                        targetCurrencyCode: transaction.targetCurrencyCode,
                    },
                    trx,
                });
            },
            'income',
        );
    }

    private async createExpenseTransaction(transaction: ICreateTransaction): Promise<number> {
        return this.processTransaction(
            transaction,
            async ({ sourceAmount, targetAmount, accountId, userId, trx, currencyCode }) => {
                const accountInWork = await this._accountService.getAccount(userId, accountId as number);

                this.validateAccount(accountInWork);
                this.validateAccountCurrency(accountInWork as IAccount, currencyCode, 'accountId');

                await this._accountService.addAmount(userId, accountId as number, sourceAmount * -1, trx);
                await this._statsOrchestratorService.create({
                    type: TransactionType.Expense,
                    userId,
                    data: {
                        date: transaction.createdAt,
                        accountId,
                        categoryId: transaction.categoryId as number,
                        sourceAmount,
                        targetAmount,
                        currencyCode: transaction.currencyCode,
                        targetCurrencyCode: transaction.targetCurrencyCode,
                    },
                    trx,
                });
            },
            'expense',
        );
    }

    private async createTransfareTransaction(transaction: ICreateTransaction): Promise<number> {
        return this.processTransaction(
            transaction,
            async ({ sourceAmount, targetAmount, accountId, userId, trx, targetAccountId, currencyCode, targetCurrencyCode }) => {
                if (!targetAccountId) {
                    throw new ValidationError({
                        message: 'Target account is required for transfer transaction',
                        errorCode: ErrorCode.ACCOUNT_ERROR,
                        payload: {
                            field: 'targetAccountId',
                            reason: 'validation:valueRequired',
                        },
                    });
                }

                const sourceAccount = await this._accountService.getAccount(userId, accountId);
                const targetAccount = await this._accountService.getAccount(userId, targetAccountId);

                this.validateAccount(sourceAccount);
                this.validateAccount(targetAccount);
                this.validateAccountCurrency(sourceAccount as IAccount, currencyCode, 'accountId');
                this.validateAccountCurrency(targetAccount as IAccount, targetCurrencyCode, 'targetAccountId');

                await this._statsOrchestratorService.create({
                    type: TransactionType.Transafer,
                    data: {
                        date: transaction.createdAt,
                        accountId,
                        targetAccountId: targetAccountId,
                        sourceAmount,
                        targetAmount,
                        currencyCode: transaction.currencyCode,
                        targetCurrencyCode: transaction.targetCurrencyCode,
                    },
                    userId,
                    trx,
                });
                await this._accountService.addAmount(userId, accountId, sourceAmount * -1, trx);
                await this._accountService.addAmount(userId, targetAccountId, targetAmount, trx);
            },
            'transfare',
        );
    }

    private async processTransaction(
        transaction: ICreateTransaction,
        operation: ({
            sourceAmount,
            trx,
            accountId,
            userId,
            targetAccountId,
            currencyCode,
            targetCurrencyCode,
        }: {
            sourceAmount: number;
            currencyCode?: string;
            trx: IDBTransaction;
            accountId: number;
            userId: number;
            targetAccountId?: number;
            targetAmount: number;
            targetCurrencyCode: string;
        }) => Promise<void>,
        transactionType: 'income' | 'expense' | 'transfare',
    ): Promise<number> {
        const uow = new UnitOfWork(this._db);
        try {
            const { amount, userId, targetAccountId, accountId, currencyCode, targetAmount, targetCurrencyCode } = transaction;
            await uow.start();

            const trxInProcess = uow.getTransaction();
            this.validateTrx(trxInProcess);

            const trx = trxInProcess as IDBTransaction;

            await operation({
                sourceAmount: amount,
                targetAmount: targetAmount,
                targetCurrencyCode: targetCurrencyCode,
                accountId,
                userId,
                targetAccountId,
                currencyCode,
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
        if (Utils.isNull(account) || Utils.isNull(account?.amount) || Utils.isNull(account?.currencyCode)) {
            throw new ValidationError({
                message: 'Transaction failed: account is missing or has no amount/currencyCode',
                errorCode: ErrorCode.TRANSACTION_ERROR,
            });
        }
    }

    private validateAccountCurrency(account: IAccount, expectedCurrencyCode: string | undefined, field: string): void {
        if (Utils.isNull(expectedCurrencyCode)) {
            throw new ValidationError({
                message: `Missing currency for transaction (${field})`,
                errorCode: ErrorCode.TRANSACTION_ERROR,
                payload: { field, reason: 'validation:valueRequired' },
            });
        }
        if (account.currencyCode !== expectedCurrencyCode) {
            throw new ValidationError({
                message: `Account currency mismatch on transaction create (${field})`,
                errorCode: ErrorCode.TRANSACTION_ERROR,
                payload: { field, reason: 'validation:currencyMismatch' },
            });
        }
    }

    private validateTrx(trxInProcess: IDBTransaction | null): void {
        if (Utils.isNull(trxInProcess)) {
            throw new CustomError({
                message: 'DB transaction not initiated',
                errorCode: ErrorCode.TRANSACTION_ERROR,
                statusCode: HttpCode.INTERNAL_SERVER_ERROR,
            });
        }
    }
    public async deleteTransactionsForAccount(userId: number, accountId: number, trx?: IDBTransaction): Promise<boolean> {
        return await this._transactionDataAccess.deleteTransactionsForAccount(userId, accountId, trx);
    }
}
