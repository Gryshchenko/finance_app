import { ErrorCode, HttpCode, IEntityStats, ISummary, StatsPeriod, StatsType, Time, TransactionType } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ICategoryService } from 'services/category/CategoryService';
import { IDailyAccountStatsService } from 'services/dailyAccountStats/DailyAccountStatsService';
import { IDailyCategoryStatsService } from 'services/dailyCategoryStats/DailyCategoryStatsService';
import { IDailyIncomeStatsService } from 'services/dailyIncomeStats/DailyIncomeStatsService';
import { IDailyStatsService } from 'services/dailyStats/DailyStatsService';
import { IDailyTransferStatsService } from 'services/dailyTransferStats/DailyTransferStatsService';
import { CustomError } from 'src/utils/errors/CustomError';
import { DBError } from 'src/utils/errors/DBError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { StatsTransactionType } from 'types/StatsTransactionType';

type ISODateString = string;
type MoneyAmount = number;

interface ExpenseSnapshot {
    date: ISODateString;
    accountId: number;
    categoryId: number;
    sourceAmount: MoneyAmount;
    targetAmount: MoneyAmount;
    currencyId?: number;
    targetCurrencyId?: number;
}

interface IncomeSnapshot {
    date: ISODateString;
    incomeId: number;
    accountId: number;
    sourceAmount: MoneyAmount;
    targetAmount: MoneyAmount;
    currencyId?: number;
    targetCurrencyId?: number;
}

interface TransferSnapshot {
    date: ISODateString;
    accountId: number;
    targetAccountId: number;
    sourceAmount: MoneyAmount;
    targetAmount: MoneyAmount;
    currencyId?: number;
    targetCurrencyId?: number;
}

interface CreateExpenseCommand {
    type: TransactionType.Expense;
    userId: number;
    data: ExpenseSnapshot;
    trx?: IDBTransaction;
}

interface CreateIncomeCommand {
    type: TransactionType.Income;
    userId: number;
    data: IncomeSnapshot;
    trx?: IDBTransaction;
}

interface CreateTransferCommand {
    type: TransactionType.Transafer;
    userId: number;
    data: TransferSnapshot;
    trx?: IDBTransaction;
}

interface PatchExpenseCommand {
    type: TransactionType.Expense;
    userId: number;
    before: ExpenseSnapshot;
    after: ExpenseSnapshot;
    trx?: IDBTransaction;
}

interface PatchIncomeCommand {
    type: TransactionType.Income;
    userId: number;
    before: IncomeSnapshot;
    after: IncomeSnapshot;
    trx?: IDBTransaction;
}

interface PatchTransferCommand {
    type: TransactionType.Transafer;
    userId: number;
    before: TransferSnapshot;
    after: TransferSnapshot;
    trx?: IDBTransaction;
}

interface DeleteExpenseCommand {
    type: TransactionType.Expense;
    userId: number;
    data: ExpenseSnapshot;
    trx?: IDBTransaction;
}

interface DeleteIncomeCommand {
    type: TransactionType.Income;
    userId: number;
    data: IncomeSnapshot;
    trx?: IDBTransaction;
}

interface DeleteTransferCommand {
    type: TransactionType.Transafer;
    userId: number;
    data: TransferSnapshot;
    trx?: IDBTransaction;
}

type CreateStatsCommand = CreateExpenseCommand | CreateIncomeCommand | CreateTransferCommand;
type PatchStatsCommand = PatchExpenseCommand | PatchIncomeCommand | PatchTransferCommand;
type DeleteStatsCommand = DeleteExpenseCommand | DeleteIncomeCommand | DeleteTransferCommand;

export interface IStatsOrchestratorService {
    // timeseries(userId: number, from: string, to: string, period: StatsPeriod, cursor: number, limit: number): Promise<IPagination<ITimeseries>>;
    summary(userId: number, from: string, to: string, period: StatsPeriod): Promise<ISummary>;
    create(command: CreateStatsCommand): Promise<boolean>;
    patch(command: PatchStatsCommand): Promise<boolean>;
    delete(command: DeleteStatsCommand): Promise<boolean>;
    entityStats(userId: number, type: StatsType, id: number, from: string, to: string): Promise<IEntityStats>;
}

export default class StatsOrchestratorService extends LoggerBase implements IStatsOrchestratorService {
    private readonly _dailyCategoryStatsService: IDailyCategoryStatsService;
    private readonly _dailyIncomeStatsService: IDailyIncomeStatsService;
    private readonly _dailyAccountStatsService: IDailyAccountStatsService;
    private readonly _dailyTransferStatsService: IDailyTransferStatsService;
    private readonly _dailyStatsService: IDailyStatsService;
    private readonly _categoryService: ICategoryService;

    public constructor({
        dailyCategoryStatsService,
        dailyIncomeStatsService,
        dailyAccountStatsService,
        dailyTransferStatsService,
        dailyStatsService,
        categoryService,
    }: {
        dailyCategoryStatsService: IDailyCategoryStatsService;
        dailyIncomeStatsService: IDailyIncomeStatsService;
        dailyAccountStatsService: IDailyAccountStatsService;
        dailyTransferStatsService: IDailyTransferStatsService;
        dailyStatsService: IDailyStatsService;
        categoryService: ICategoryService;
    }) {
        super();
        this._dailyAccountStatsService = dailyAccountStatsService;
        this._dailyCategoryStatsService = dailyCategoryStatsService;
        this._dailyIncomeStatsService = dailyIncomeStatsService;
        this._dailyTransferStatsService = dailyTransferStatsService;
        this._dailyStatsService = dailyStatsService;
        this._categoryService = categoryService;
    }

    public async create(command: CreateStatsCommand): Promise<boolean> {
        const { trx, userId, type } = command;
        // NOTE: sourceAmount = the "from" amount in currencyId (money leaving); targetAmount = the "to" amount in
        // targetCurrencyId (money arriving). No swapping — every leg passes sourceAmount/targetAmount straight
        // through, and every per-entity table stores BOTH legs: income/category/transfer keep source_total +
        // target_total; an account keeps them per direction (income_source_total/income_target_total when it
        // receives, expense_source_total/expense_target_total when it sends). Summaries read the entity's
        // own-currency column (income → source_total; category → target_total; account → income_target_total +
        // expense_source_total) and are never converted/merged across currencies. The global daily_stats aggregate
        // currently sums sourceAmount across currencies — handled in a separate redesign (per-currency + % trends).
        switch (type) {
            case TransactionType.Income: {
                const { accountId, incomeId, sourceAmount, targetAmount, currencyId, targetCurrencyId, date } = command.data;
                const response = await Promise.all([
                    await this._dailyStatsService.updateTotal({
                        userId,
                        date,
                        type: StatsTransactionType.INCOME,
                        amount: sourceAmount,
                        trx,
                    }),
                    await this._dailyIncomeStatsService.updateTotal({
                        userId,
                        date,
                        incomeId,
                        sourceAmount,
                        targetAmount,
                        currencyId,
                        targetCurrencyId,
                        trx,
                    }),
                    await this._dailyAccountStatsService.updateTotal({
                        userId,
                        date,
                        accountId,
                        type: StatsTransactionType.INCOME,
                        sourceAmount,
                        targetAmount,
                        currencyId,
                        targetCurrencyId,
                        trx,
                    }),
                ]);
                const allSucceeded = response.every((r) => r === true);

                if (!allSucceeded) {
                    throw new DBError({ message: 'Not all incomes stats updates succeeded', errorCode: ErrorCode.STATS_ERROR });
                }
                return true;
            }
            case TransactionType.Expense: {
                const { accountId, categoryId, sourceAmount, targetAmount, currencyId, targetCurrencyId, date } = command.data;
                const response = await Promise.all([
                    await this._dailyStatsService.updateTotal({
                        userId,
                        date,
                        type: StatsTransactionType.EXPENSE,
                        amount: sourceAmount,
                        trx,
                    }),
                    await this._dailyAccountStatsService.updateTotal({
                        userId,
                        date,
                        accountId,
                        type: StatsTransactionType.EXPENSE,
                        sourceAmount,
                        targetAmount,
                        currencyId,
                        targetCurrencyId,
                        trx,
                    }),
                    await this._dailyCategoryStatsService.updateTotal({
                        userId,
                        date,
                        categoryId,
                        sourceAmount,
                        targetAmount,
                        currencyId,
                        targetCurrencyId,
                        trx,
                    }),
                ]);
                const allSucceeded = response.every((r) => r === true);

                if (!allSucceeded) {
                    throw new DBError({ message: 'Not all expanse stats updates succeeded', errorCode: ErrorCode.STATS_ERROR });
                }
                return true;
            }
            case TransactionType.Transafer: {
                const { accountId, targetAccountId, date, sourceAmount, targetAmount, currencyId, targetCurrencyId } =
                    command.data;
                const response = await Promise.all([
                    await this._dailyStatsService.updateTotal({
                        userId,
                        date,
                        type: StatsTransactionType.TRANSFER,
                        amount: sourceAmount,
                        trx,
                    }),
                    await this._dailyAccountStatsService.updateTotal({
                        userId,
                        date,
                        accountId,
                        type: StatsTransactionType.EXPENSE,
                        sourceAmount,
                        targetAmount,
                        currencyId,
                        targetCurrencyId,
                        trx,
                    }),
                    await this._dailyAccountStatsService.updateTotal({
                        userId,
                        date,
                        accountId: targetAccountId,
                        type: StatsTransactionType.INCOME,
                        sourceAmount,
                        targetAmount,
                        currencyId,
                        targetCurrencyId,
                        trx,
                    }),
                    await this._dailyTransferStatsService.updateTotal({
                        userId,
                        date,
                        accountId,
                        targetAccountId,
                        sourceAmount,
                        targetAmount,
                        currencyId,
                        targetCurrencyId,
                        trx,
                    }),
                ]);
                const allSucceeded = response.every((r) => r === true);

                if (!allSucceeded) {
                    throw new DBError({ message: 'Not all transfer stats updates succeeded', errorCode: ErrorCode.STATS_ERROR });
                }
                return true;
            }
            default: {
                throw new CustomError({
                    statusCode: HttpCode.BAD_REQUEST,
                    errorCode: ErrorCode.STATS_ERROR,
                    message: 'Transaction unsupported create transaction type',
                });
            }
        }
    }

    public async patch(command: PatchStatsCommand): Promise<boolean> {
        const { trx, userId, type, before, after } = command;
        // A patch mirrors a create: add the new snapshot to the score and subtract the previous one,
        // using the exact same value -> column mapping as create().
        switch (type) {
            case TransactionType.Income: {
                if (
                    before.sourceAmount !== after.sourceAmount ||
                    before.date !== after.date ||
                    before.accountId !== after.accountId ||
                    before?.incomeId !== after?.incomeId ||
                    before?.targetAmount !== after?.targetAmount
                ) {
                    const response = await Promise.all([
                        await this._dailyStatsService.addToScore({
                            userId,
                            date: after.date,
                            incomeTotal: after.sourceAmount,
                            expenseTotal: 0,
                            transferTotal: 0,
                            trx,
                        }),
                        await this._dailyIncomeStatsService.addToScore({
                            userId,
                            date: after.date,
                            incomeId: after.incomeId,
                            sourceAmount: after.sourceAmount,
                            targetAmount: after.targetAmount,
                            trx,
                        }),
                        await this._dailyAccountStatsService.addToScore({
                            userId,
                            date: after.date,
                            accountId: after.accountId,
                            type: StatsTransactionType.INCOME,
                            sourceAmount: after.sourceAmount,
                            targetAmount: after.targetAmount,
                            trx,
                        }),
                        await this._dailyStatsService.subtractFromScore({
                            userId,
                            date: before.date,
                            incomeTotal: before.sourceAmount,
                            expenseTotal: 0,
                            transferTotal: 0,
                            trx,
                        }),
                        await this._dailyIncomeStatsService.subtractFromScore({
                            userId,
                            date: before.date,
                            incomeId: before.incomeId,
                            sourceAmount: before.sourceAmount,
                            targetAmount: before.targetAmount,
                            trx,
                        }),
                        await this._dailyAccountStatsService.subtractFromScore({
                            userId,
                            date: before.date,
                            accountId: before.accountId,
                            type: StatsTransactionType.INCOME,
                            sourceAmount: before.sourceAmount,
                            targetAmount: before.targetAmount,
                            trx,
                        }),
                    ]);
                    const allSucceeded = response.every((r) => r === true);

                    if (!allSucceeded) {
                        throw new DBError({ message: 'Not all patch stats updates succeeded', errorCode: ErrorCode.STATS_ERROR });
                    }
                }
                return true;
            }
            case TransactionType.Expense: {
                if (
                    before.sourceAmount !== after.sourceAmount ||
                    before.date !== after.date ||
                    before.accountId !== after.accountId ||
                    before?.categoryId !== after?.categoryId ||
                    before?.targetAmount !== after?.targetAmount
                ) {
                    const response = await Promise.all([
                        await this._dailyStatsService.addToScore({
                            userId,
                            date: after.date,
                            incomeTotal: 0,
                            expenseTotal: after.sourceAmount,
                            transferTotal: 0,
                            trx,
                        }),
                        await this._dailyAccountStatsService.addToScore({
                            userId,
                            date: after.date,
                            accountId: after.accountId,
                            type: StatsTransactionType.EXPENSE,
                            sourceAmount: after.sourceAmount,
                            targetAmount: after.targetAmount,
                            trx,
                        }),
                        await this._dailyCategoryStatsService.addToScore({
                            userId,
                            date: after.date,
                            categoryId: after.categoryId,
                            sourceAmount: after.sourceAmount,
                            targetAmount: after.targetAmount,
                            trx,
                        }),
                        await this._dailyStatsService.subtractFromScore({
                            userId,
                            date: before.date,
                            incomeTotal: 0,
                            expenseTotal: before.sourceAmount,
                            transferTotal: 0,
                            trx,
                        }),
                        await this._dailyAccountStatsService.subtractFromScore({
                            userId,
                            date: before.date,
                            accountId: before.accountId,
                            type: StatsTransactionType.EXPENSE,
                            sourceAmount: before.sourceAmount,
                            targetAmount: before.targetAmount,
                            trx,
                        }),
                        await this._dailyCategoryStatsService.subtractFromScore({
                            userId,
                            date: before.date,
                            categoryId: before.categoryId,
                            sourceAmount: before.sourceAmount,
                            targetAmount: before.targetAmount,
                            trx,
                        }),
                    ]);
                    const allSucceeded = response.every((r) => r === true);

                    if (!allSucceeded) {
                        throw new DBError({ message: 'Not all patch stats updates succeeded', errorCode: ErrorCode.STATS_ERROR });
                    }
                }
                return true;
            }
            case TransactionType.Transafer: {
                if (
                    before.sourceAmount !== after.sourceAmount ||
                    before.date !== after.date ||
                    before.accountId !== after.accountId ||
                    before?.targetAccountId !== after?.targetAccountId ||
                    before?.targetAmount !== after?.targetAmount
                ) {
                    const response = await Promise.all([
                        await this._dailyStatsService.addToScore({
                            userId,
                            date: after.date,
                            incomeTotal: 0,
                            expenseTotal: 0,
                            transferTotal: after.sourceAmount,
                            trx,
                        }),
                        await this._dailyAccountStatsService.addToScore({
                            userId,
                            date: after.date,
                            accountId: after.accountId,
                            type: StatsTransactionType.EXPENSE,
                            sourceAmount: after.sourceAmount,
                            targetAmount: after.targetAmount,
                            trx,
                        }),
                        await this._dailyAccountStatsService.addToScore({
                            userId,
                            date: after.date,
                            accountId: after.targetAccountId,
                            type: StatsTransactionType.INCOME,
                            sourceAmount: after.sourceAmount,
                            targetAmount: after.targetAmount,
                            trx,
                        }),
                        await this._dailyStatsService.subtractFromScore({
                            userId,
                            date: before.date,
                            incomeTotal: 0,
                            expenseTotal: 0,
                            transferTotal: before.sourceAmount,
                            trx,
                        }),
                        await this._dailyAccountStatsService.subtractFromScore({
                            userId,
                            date: before.date,
                            accountId: before.accountId,
                            type: StatsTransactionType.EXPENSE,
                            sourceAmount: before.sourceAmount,
                            targetAmount: before.targetAmount,
                            trx,
                        }),
                        await this._dailyAccountStatsService.subtractFromScore({
                            userId,
                            date: before.date,
                            accountId: before.targetAccountId,
                            type: StatsTransactionType.INCOME,
                            sourceAmount: before.sourceAmount,
                            targetAmount: before.targetAmount,
                            trx,
                        }),
                    ]);
                    const allSucceeded = response.every((r) => r === true);

                    if (!allSucceeded) {
                        throw new DBError({ message: 'Not all patch stats updates succeeded', errorCode: ErrorCode.STATS_ERROR });
                    }
                }
                return true;
            }
            default: {
                throw new CustomError({
                    statusCode: HttpCode.BAD_REQUEST,
                    errorCode: ErrorCode.STATS_ERROR,
                    message: 'Transaction unsupported create transaction type',
                });
            }
        }
    }
    public async delete(command: DeleteStatsCommand): Promise<boolean> {
        const { trx, userId, type, data } = command;
        // A delete reverses a create: subtract the snapshot from the score using the same mapping as create().
        switch (type) {
            case TransactionType.Income:
                {
                    const { date, sourceAmount, accountId, incomeId, targetAmount } = data;
                    const response = await Promise.all([
                        await this._dailyStatsService.subtractFromScore({
                            userId,
                            date,
                            incomeTotal: sourceAmount,
                            expenseTotal: 0,
                            transferTotal: 0,
                            trx,
                        }),
                        await this._dailyIncomeStatsService.subtractFromScore({
                            userId,
                            date,
                            incomeId,
                            sourceAmount,
                            targetAmount,
                            trx,
                        }),
                        await this._dailyAccountStatsService.subtractFromScore({
                            userId,
                            date,
                            accountId,
                            type: StatsTransactionType.INCOME,
                            sourceAmount,
                            targetAmount,
                            trx,
                        }),
                    ]);
                    const allSucceeded = response.every((r) => r === true);

                    if (!allSucceeded) {
                        throw new DBError({
                            message: 'Not all delete stats updates succeeded',
                            errorCode: ErrorCode.STATS_ERROR,
                        });
                    }
                }
                return true;
            case TransactionType.Expense:
                {
                    const { date, sourceAmount, accountId, categoryId, targetAmount } = data;
                    const response = await Promise.all([
                        await this._dailyStatsService.subtractFromScore({
                            userId,
                            date,
                            incomeTotal: 0,
                            expenseTotal: sourceAmount,
                            transferTotal: 0,
                            trx,
                        }),
                        await this._dailyAccountStatsService.subtractFromScore({
                            userId,
                            date,
                            accountId,
                            type: StatsTransactionType.EXPENSE,
                            sourceAmount,
                            targetAmount,
                            trx,
                        }),
                        await this._dailyCategoryStatsService.subtractFromScore({
                            userId,
                            date,
                            categoryId,
                            sourceAmount,
                            targetAmount,
                            trx,
                        }),
                    ]);
                    const allSucceeded = response.every((r) => r === true);

                    if (!allSucceeded) {
                        throw new DBError({
                            message: 'Not all delete stats updates succeeded',
                            errorCode: ErrorCode.STATS_ERROR,
                        });
                    }
                }
                return true;
            case TransactionType.Transafer: {
                const { date, sourceAmount, accountId, targetAccountId, targetAmount } = data;
                const response = await Promise.all([
                    await this._dailyStatsService.subtractFromScore({
                        userId,
                        date,
                        incomeTotal: 0,
                        expenseTotal: 0,
                        transferTotal: sourceAmount,
                        trx,
                    }),
                    await this._dailyAccountStatsService.subtractFromScore({
                        userId,
                        date,
                        accountId,
                        type: StatsTransactionType.EXPENSE,
                        sourceAmount,
                        targetAmount,
                        trx,
                    }),
                    await this._dailyAccountStatsService.subtractFromScore({
                        userId,
                        date,
                        accountId: targetAccountId,
                        type: StatsTransactionType.INCOME,
                        sourceAmount,
                        targetAmount,
                        trx,
                    }),
                ]);
                const allSucceeded = response.every((r) => r === true);

                if (!allSucceeded) {
                    throw new DBError({ message: 'Not all delete stats updates succeeded', errorCode: ErrorCode.STATS_ERROR });
                }
                return true;
            }
            default: {
                throw new CustomError({
                    statusCode: HttpCode.BAD_REQUEST,
                    errorCode: ErrorCode.STATS_ERROR,
                    message: 'Transaction unsupported create transaction type',
                });
            }
        }
    }
    public async summary(userId: number, from: string, to: string, period: StatsPeriod): Promise<ISummary> {
        return await this._dailyStatsService.summary(userId, from, to, period);
    }
    public async entityStats(userId: number, type: StatsType, id: number, from: string, to: string): Promise<IEntityStats> {
        const startDate = Time.toMonthStart(from);
        const endDate = to;
        if (!startDate) {
            throw new ValidationError({
                message: `From date is invalid: ${from}`,
                errorCode: ErrorCode.STATS_ERROR,
                payload: {
                    field: 'from',
                    reason: 'validation:date',
                },
            });
        }
        if (!endDate) {
            throw new ValidationError({
                message: `To date is invalid: ${to}`,
                errorCode: ErrorCode.STATS_ERROR,
                payload: {
                    field: 'to',
                    reason: 'validation:date',
                },
            });
        }

        const prevStartDate = Time.toPreviousMonthStart(from);
        const prevEndDate = Time.toPreviousMonthEndExclusive(to);
        if (!prevStartDate || !prevEndDate) {
            throw new ValidationError({
                message: `Invalid date properties from: ${startDate}, to: ${prevEndDate} `,
                errorCode: ErrorCode.STATS_ERROR,
                payload: {
                    field: 'from',
                    reason: 'validation:date',
                },
            });
        }
        switch (type) {
            case StatsType.Income: {
                const current = await this._dailyIncomeStatsService.summary(userId, id, startDate, endDate);
                const previous = await this._dailyIncomeStatsService.summary(userId, id, prevStartDate, prevEndDate);
                const vsLastMonthIncomePct =
                    previous.total === 0
                        ? current.total === 0
                            ? 0
                            : 100
                        : Math.round(((current.total - previous.total) / previous.total) * 100);
                return {
                    incomeMTD: current.total,
                    vsLastMonthIncomePct,
                };
            }
            case StatsType.Expense: {
                const category = await this._categoryService.get(userId, id);
                const budget = category?.budget ?? 0;
                const current = await this._dailyCategoryStatsService.summary(userId, id, startDate, endDate);
                const previous = await this._dailyCategoryStatsService.summary(userId, id, prevStartDate, prevEndDate);
                const vsLastMonthSpendPct =
                    previous.total === 0
                        ? current.total === 0
                            ? 0
                            : 100
                        : Math.round(((current.total - previous.total) / previous.total) * 100);
                return {
                    spendMTD: current.total,
                    vsLastMonthSpendPct,
                    budgetTotal: budget > 0 ? budget : undefined,
                };
            }
            case StatsType.Account:
                const currentTransfer = await this._dailyTransferStatsService.summary(userId, id, startDate, endDate);
                const currentAccount = await this._dailyAccountStatsService.summary(userId, id, startDate, endDate);
                const previousAccount = await this._dailyAccountStatsService.summary(userId, id, prevStartDate, prevEndDate);
                const vsLastMonthSpendPctAccount =
                    previousAccount.totalExpanse === 0
                        ? currentAccount.totalExpanse === 0
                            ? 0
                            : 100
                        : Math.round(
                              ((currentAccount.totalExpanse - previousAccount.totalExpanse) / previousAccount.totalExpanse) * 100,
                          );
                const vsLastMonthIncomePctAccount =
                    previousAccount.totalIncome === 0
                        ? currentAccount.totalIncome === 0
                            ? 0
                            : 100
                        : Math.round(
                              ((currentAccount.totalIncome - previousAccount.totalIncome) / previousAccount.totalIncome) * 100,
                          );
                return {
                    spendMTD: currentAccount.totalExpanse,
                    vsLastMonthSpendPct: vsLastMonthSpendPctAccount,
                    transferMTD: currentTransfer.source_total,
                    incomeMTD: currentAccount.totalIncome,
                    vsLastMonthIncomePct: vsLastMonthIncomePctAccount,
                    savingsRate: (currentAccount.totalIncome - currentAccount.totalExpanse) * 0.1,
                };
            default: {
                throw new ValidationError({
                    statusCode: HttpCode.BAD_REQUEST,
                    errorCode: ErrorCode.STATS_ERROR,
                    message: `Transaction unsupported create stats type: ${type}`,
                });
            }
        }
    }
}
