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
import { IBalanceService } from 'services/balance/BalanceService';
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
    private readonly _balanceService: IBalanceService;
    private readonly _statsOrchestratorService: IStatsOrchestratorService;
    private readonly _db: IDatabaseConnection;

    public constructor(
        transactionDataAccess: ITransactionDataAccess,
        accountService: IAccountService,
        balanceService: IBalanceService,
        statsOrchestratorService: IStatsOrchestratorService,
        db: IDatabaseConnection,
    ) {
        super();
        this._transactionDataAccess = transactionDataAccess;
        this._accountService = accountService;
        this._balanceService = balanceService;
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
            await this._balanceService.patch(
                userId,
                {
                    amount: trs?.amount * -1,
                    currencyCode: trs.currencyCode,
                },
                trx,
            );
            switch (trs.transactionTypeId) {
                case TransactionType.Expense: {
                    await this._statsOrchestratorService.delete({
                        type: TransactionType.Expense,
                        userId,
                        data: {
                            date: trs.createdAt,
                            accountId: trs.accountId,
                            categoryId: trs.categoryId as number,
                            amount: trs.amount,
                        },
                        trx,
                    });
                    break;
                }
                case TransactionType.Income: {
                    await this._statsOrchestratorService.delete({
                        type: TransactionType.Income,
                        userId,
                        data: {
                            date: trs.createdAt,
                            accountId: trs.accountId,
                            incomeId: trs.incomeId as number,
                            amount: trs.amount,
                        },
                        trx,
                    });
                    break;
                }
                case TransactionType.Transafer: {
                    await this._statsOrchestratorService.delete({
                        type: TransactionType.Transafer,
                        userId,
                        data: {
                            date: trs.createdAt,
                            accountId: trs.accountId,
                            targetAccountId: trs.targetAccountId as number,
                            amount: trs.amount,
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

            const trs = await this._transactionDataAccess.getTransaction(userId, transaction?.transactionId, trx);
            const result = await this._transactionDataAccess.patchTransaction(userId, transaction, trx);
            if (!trs) {
                throw new ValidationError({
                    message: 'Transaction could not be deleted',
                });
            }
            if (Utils.isNotNull(transaction.amount) || Utils.isNotNull(transaction.createdAt)) {
                if (Utils.isNotNull(transaction.amount)) {
                    const delta = transaction.amount - trs.amount;
                    await this._balanceService.patch(
                        userId,
                        {
                            amount: delta,
                            currencyCode: trs.currencyCode,
                        },
                        trx,
                    );
                }
                const transactionsInWork: IPatchTransaction = {
                    transactionId: transaction.transactionId,
                    accountId: transaction?.accountId ?? trs.accountId,
                    incomeId: transaction.incomeId ?? trs.incomeId,
                    categoryId: transaction.categoryId ?? (trs.categoryId as number),
                    amount: transaction.amount ?? trs.amount,
                    description: transaction.description ?? trs.description,
                    createdAt: transaction.createdAt ?? trs.createdAt,
                    targetAccountId: transaction.targetAccountId ?? (trs.targetAccountId as number),
                };
                switch (trs.transactionTypeId) {
                    case TransactionType.Expense: {
                        await this._statsOrchestratorService.patch({
                            userId,
                            type: TransactionType.Expense,
                            after: {
                                categoryId: transactionsInWork.categoryId as number,
                                accountId: transactionsInWork.accountId,
                                date: transactionsInWork.createdAt,
                                amount: transactionsInWork.amount,
                            },
                            before: {
                                categoryId: trs.categoryId as number,
                                accountId: trs.accountId,
                                date: trs.createdAt,
                                amount: trs.amount,
                            },
                            trx,
                        });
                        break;
                    }
                    case TransactionType.Income: {
                        await this._statsOrchestratorService.patch({
                            userId,
                            type: TransactionType.Income,
                            after: {
                                incomeId: transactionsInWork.incomeId as number,
                                accountId: transactionsInWork.accountId,
                                date: transactionsInWork.createdAt,
                                amount: transactionsInWork.amount,
                            },
                            before: {
                                incomeId: trs.incomeId as number,
                                accountId: trs.accountId,
                                date: trs.createdAt,
                                amount: trs.amount,
                            },
                            trx,
                        });
                        break;
                    }
                    case TransactionType.Transafer: {
                        await this._statsOrchestratorService.patch({
                            userId,
                            type: TransactionType.Transafer,
                            after: {
                                targetAccountId: transactionsInWork.targetAccountId as number,
                                accountId: transactionsInWork.accountId,
                                date: transactionsInWork.createdAt,
                                amount: transactionsInWork.amount,
                            },
                            before: {
                                targetAccountId: trs.targetAccountId as number,
                                accountId: trs.accountId,
                                date: trs.createdAt,
                                amount: trs.amount,
                            },
                            trx,
                        });
                        break;
                    }
                }
            }
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
    async getTransaction(userId: number, transactionId: number): Promise<ITransaction | undefined> {
        return await this._transactionDataAccess.getTransaction(userId, transactionId);
    }
    async getTransactions(data: ITransactionListItemsRequest): Promise<IPagination<ITransactionListItem | null>> {
        return await this._transactionDataAccess.getTransactions(data);
    }
    private async createIncomeTransaction(transaction: ICreateTransaction): Promise<number> {
        return this.processTransaction(
            transaction,
            async ({ transactionAmount, accountId, userId, trx }) => {
                const accountInWork = await this._accountService.getAccount(userId, accountId as number);

                this.validateAccount(accountInWork);

                const currentAmount = (accountInWork as IAccount).amount;
                const newAmount = Utils.roundNumber(currentAmount) + Utils.roundNumber(transactionAmount);
                await this._balanceService.patch(
                    userId,
                    { amount: transactionAmount, currencyCode: accountInWork?.currencyCode as string },
                    trx,
                );
                await this._accountService.patchAccount(userId, accountId as number, { amount: newAmount }, trx);
                await this._statsOrchestratorService.create({
                    type: TransactionType.Income,
                    userId,
                    data: {
                        amount: transactionAmount,
                        incomeId: transaction.incomeId as number,
                        accountId,
                        date: transaction.createdAt,
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
            async ({ transactionAmount, accountId, userId, trx }) => {
                const accountInWork = await this._accountService.getAccount(userId, accountId as number);

                this.validateAccount(accountInWork);

                const currentAmount = (accountInWork as IAccount).amount;
                const newAmount = Utils.roundNumber(currentAmount) - Utils.roundNumber(transactionAmount);
                await this._balanceService.patch(
                    userId,
                    { amount: transactionAmount * -1, currencyCode: accountInWork?.currencyCode as string },
                    trx,
                );
                await this._accountService.patchAccount(userId, accountId as number, { amount: newAmount }, trx);
                await this._statsOrchestratorService.create({
                    type: TransactionType.Expense,
                    userId,
                    data: {
                        date: transaction.createdAt,
                        accountId,
                        categoryId: transaction.categoryId as number,
                        amount: transactionAmount,
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
            async ({ transactionAmount, accountId, userId, trx, targetAccountId }) => {
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

                const newSourceAmount =
                    Utils.roundNumber((sourceAccount as IAccount).amount) - Utils.roundNumber(transactionAmount);
                const newTargetAmount =
                    Utils.roundNumber((targetAccount as IAccount).amount) + Utils.roundNumber(transactionAmount);
                await this._statsOrchestratorService.create({
                    type: TransactionType.Transafer,
                    data: {
                        date: transaction.createdAt,
                        accountId,
                        targetAccountId: targetAccountId,
                        amount: Utils.roundNumber(transactionAmount),
                    },
                    userId,
                    trx,
                });
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
                errorCode: ErrorCode.TRANSACTION_ERROR,
                statusCode: HttpCode.INTERNAL_SERVER_ERROR,
            });
        }
    }
    public async deleteTransactionsForAccount(userId: number, accountId: number, trx?: IDBTransaction): Promise<boolean> {
        return await this._transactionDataAccess.deleteTransactionsForAccount(userId, accountId, trx);
    }
}
