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
    targetAmount: number;
    expanseSourceAmount: MoneyAmount;
    expanseTargetAmount: MoneyAmount;
}

interface IncomeSnapshot {
    date: ISODateString;
    incomeId: number;
    accountId: number;
    sourceAmount: MoneyAmount;
    targetAmount: MoneyAmount;
}

interface TransferSnapshot {
    date: ISODateString;
    accountId: number;
    targetAccountId: number;
    sourceAmount: MoneyAmount;
    targetAmount: MoneyAmount;
    expanseSourceAmount: MoneyAmount;
    expanseTargetAmount: MoneyAmount;
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
        switch (type) {
            case TransactionType.Income: {
                const { accountId, incomeId, sourceAmount, targetAmount, date } = command.data;
                const response = await Promise.all([
                    await this._dailyStatsService.updateTotal(userId, date, StatsTransactionType.INCOME, sourceAmount, trx),
                    await this._dailyIncomeStatsService.updateTotal(userId, date, incomeId, sourceAmount, targetAmount, trx),
                    await this._dailyAccountStatsService.updateTotal(
                        userId,
                        date,
                        accountId,
                        StatsTransactionType.INCOME,
                        sourceAmount,
                        targetAmount,
                        trx,
                    ),
                ]);
                const allSucceeded = response.every((r) => r === true);

                if (!allSucceeded) {
                    throw new DBError({ message: 'Not all incomes stats updates succeeded', errorCode: ErrorCode.STATS_ERROR });
                }
                return true;
            }
            case TransactionType.Expense: {
                const { accountId, categoryId, sourceAmount, targetAmount, date } = command.data;
                // TODO convert to user currency
                const response = await Promise.all([
                    await this._dailyStatsService.updateTotal(userId, date, StatsTransactionType.EXPENSE, sourceAmount, trx),
                    await this._dailyAccountStatsService.updateTotal(
                        userId,
                        date,
                        accountId,
                        StatsTransactionType.EXPENSE,
                        sourceAmount,
                        targetAmount,
                        trx,
                    ),
                    await this._dailyCategoryStatsService.updateTotal(userId, date, categoryId, sourceAmount, targetAmount, trx),
                ]);
                const allSucceeded = response.every((r) => r === true);

                if (!allSucceeded) {
                    throw new DBError({ message: 'Not all expanse stats updates succeeded', errorCode: ErrorCode.STATS_ERROR });
                }
                return true;
            }
            case TransactionType.Transafer: {
                const { accountId, targetAccountId, date, sourceAmount, targetAmount } = command.data;
                const response = await Promise.all([
                    await this._dailyStatsService.updateTotal(userId, date, StatsTransactionType.TRANSFER, sourceAmount, trx),
                    await this._dailyAccountStatsService.updateTotal(
                        userId,
                        date,
                        accountId,
                        StatsTransactionType.EXPENSE,
                        sourceAmount,
                        targetAmount,
                        trx,
                    ),
                    await this._dailyAccountStatsService.updateTotal(
                        userId,
                        date,
                        targetAccountId,
                        StatsTransactionType.INCOME,
                        sourceAmount,
                        targetAmount,
                        trx,
                    ),
                    await this._dailyTransferStatsService.updateTotal(
                        userId,
                        date,
                        accountId,
                        targetAccountId,
                        sourceAmount,
                        targetAmount,
                        trx,
                    ),
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
                        await this._dailyStatsService.addToScore(userId, after.date, after.sourceAmount, 0, 0, trx),
                        await this._dailyIncomeStatsService.addToScore(
                            userId,
                            after.date,
                            after.sourceAmount,
                            after.targetAmount,
                            after?.incomeId,
                            trx,
                        ),
                        await this._dailyAccountStatsService.addToScore(
                            userId,
                            after.date,
                            after.sourceAmount,
                            after.targetAmount,
                            0,
                            0,
                            after.accountId,
                            trx,
                        ),
                        await this._dailyStatsService.subtractFromScore(userId, before.date, before.sourceAmount, 0, 0, trx),
                        await this._dailyIncomeStatsService.subtractFromScore(
                            userId,
                            before.date,
                            before.sourceAmount,
                            before.targetAmount,
                            before.incomeId,
                            trx,
                        ),
                        await this._dailyAccountStatsService.subtractFromScore(
                            userId,
                            before.date,
                            before.sourceAmount,
                            before.targetAmount,
                            0,
                            0,
                            before.accountId,
                            trx,
                        ),
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
                        await this._dailyStatsService.addToScore(userId, after.date, 0, after.sourceAmount, 0, trx),
                        await this._dailyAccountStatsService.addToScore(
                            userId,
                            after.date,
                            0,
                            0,
                            after.targetAmount,
                            after.sourceAmount,
                            after.accountId,
                            trx,
                        ),
                        await this._dailyCategoryStatsService.addToScore(
                            userId,
                            after.date,
                            after.sourceAmount,
                            after.targetAmount,
                            after.categoryId,
                            trx,
                        ),
                        await this._dailyStatsService.subtractFromScore(userId, before.date, 0, before.sourceAmount, 0, trx),
                        await this._dailyAccountStatsService.subtractFromScore(
                            userId,
                            before.date,
                            0,
                            0,
                            before.targetAmount,
                            before.sourceAmount,
                            before.accountId,
                            trx,
                        ),
                        await this._dailyCategoryStatsService.subtractFromScore(
                            userId,
                            before.date,
                            before.targetAmount,
                            before.sourceAmount,
                            before.categoryId,
                            trx,
                        ),
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
                        await this._dailyStatsService.addToScore(userId, after.date, 0, 0, after.sourceAmount, trx),
                        await this._dailyAccountStatsService.addToScore(
                            userId,
                            after.date,
                            0,
                            0,
                            after.sourceAmount,
                            after.targetAmount,
                            after.accountId,
                            trx,
                        ),
                        await this._dailyAccountStatsService.addToScore(
                            userId,
                            after.date,
                            0,
                            0,
                            after.sourceAmount,
                            after.targetAmount,
                            after.targetAccountId,
                            trx,
                        ),
                        await this._dailyStatsService.subtractFromScore(userId, before.date, 0, 0, before.sourceAmount, trx),
                        await this._dailyAccountStatsService.subtractFromScore(
                            userId,
                            before.date,
                            0,
                            0,
                            before.sourceAmount,
                            before.sourceAmount,
                            before.accountId,
                            trx,
                        ),
                        await this._dailyAccountStatsService.subtractFromScore(
                            userId,
                            before.date,
                            0,
                            0,
                            before.sourceAmount,
                            before.targetAmount,
                            before.targetAccountId,
                            trx,
                        ),
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
        switch (type) {
            case TransactionType.Income:
                {
                    const { date, sourceAmount, accountId, incomeId, targetAmount } = data;
                    const response = await Promise.all([
                        await this._dailyStatsService.subtractFromScore(userId, date, sourceAmount, 0, 0, trx),
                        await this._dailyIncomeStatsService.subtractFromScore(
                            userId,
                            date,
                            sourceAmount,
                            targetAmount,
                            incomeId,
                            trx,
                        ),
                        await this._dailyAccountStatsService.subtractFromScore(
                            userId,
                            date,
                            sourceAmount,
                            targetAmount,
                            0,
                            0,
                            accountId,
                            trx,
                        ),
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
                    const { date, sourceAmount, accountId, categoryId, targetAmount, expanseTargetAmount, expanseSourceAmount } =
                        data;
                    const response = await Promise.all([
                        await this._dailyStatsService.subtractFromScore(
                            userId,
                            date,
                            sourceAmount,
                            targetAmount,

                            trx,
                        ),
                        await this._dailyAccountStatsService.subtractFromScore(
                            userId,
                            date,
                            sourceAmount,
                            targetAmount,
                            expanseSourceAmount,
                            expanseTargetAmount,
                            accountId,
                            trx,
                        ),
                        await this._dailyCategoryStatsService.subtractFromScore(
                            userId,
                            date,
                            targetAmount,
                            targetAmount,
                            categoryId,
                            trx,
                        ),
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
                const { date, sourceAmount, accountId, targetAccountId, targetAmount, expanseSourceAmount, expanseTargetAmount } =
                    data;
                const response = await Promise.all([
                    await this._dailyStatsService.subtractFromScore(userId, date, sourceAmount, trx),
                    await this._dailyAccountStatsService.subtractFromScore(
                        userId,
                        date,
                        sourceAmount,
                        targetAmount,
                        expanseSourceAmount,
                        expanseTargetAmount,
                        accountId,
                        trx,
                    ),
                    await this._dailyAccountStatsService.subtractFromScore(
                        userId,
                        date,
                        sourceAmount,
                        targetAmount,
                        expanseSourceAmount,
                        expanseTargetAmount,
                        targetAccountId,
                        trx,
                    ),
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
                    transferMTD: currentTransfer.total,
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
