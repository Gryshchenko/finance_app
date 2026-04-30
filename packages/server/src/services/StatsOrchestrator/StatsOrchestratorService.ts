import { ErrorCode, HttpCode, IEntityStats, ISummary, StatsPeriod, Time, TransactionType } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
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
    amount: MoneyAmount;
}

interface IncomeSnapshot {
    date: ISODateString;
    incomeId: number;
    accountId: number;
    amount: MoneyAmount;
}

interface TransferSnapshot {
    date: ISODateString;
    accountId: number;
    targetAccountId: number;
    amount: MoneyAmount;
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
    entityStats(userId: number, type: TransactionType, id: number, from: string, to: string): Promise<IEntityStats>;
}

export default class StatsOrchestratorService extends LoggerBase implements IStatsOrchestratorService {
    private readonly _dailyCategoryStatsService: IDailyCategoryStatsService;
    private readonly _dailyIncomeStatsService: IDailyIncomeStatsService;
    private readonly _dailyAccountStatsService: IDailyAccountStatsService;
    private readonly _dailyTransferStatsService: IDailyTransferStatsService;
    private readonly _dailyStatsService: IDailyStatsService;

    public constructor({
        dailyCategoryStatsService,
        dailyIncomeStatsService,
        dailyAccountStatsService,
        dailyTransferStatsService,
        dailyStatsService,
    }: {
        dailyCategoryStatsService: IDailyCategoryStatsService;
        dailyIncomeStatsService: IDailyIncomeStatsService;
        dailyAccountStatsService: IDailyAccountStatsService;
        dailyTransferStatsService: IDailyTransferStatsService;
        dailyStatsService: IDailyStatsService;
    }) {
        super();
        this._dailyAccountStatsService = dailyAccountStatsService;
        this._dailyCategoryStatsService = dailyCategoryStatsService;
        this._dailyIncomeStatsService = dailyIncomeStatsService;
        this._dailyTransferStatsService = dailyTransferStatsService;
        this._dailyStatsService = dailyStatsService;
    }

    public async create(command: CreateStatsCommand): Promise<boolean> {
        const { trx, userId, type } = command;
        switch (type) {
            case TransactionType.Income: {
                const { accountId, incomeId, amount, date } = command.data;
                const response = await Promise.all([
                    await this._dailyStatsService.updateTotal(userId, date, StatsTransactionType.INCOME, amount, trx),
                    await this._dailyAccountStatsService.updateTotal(
                        userId,
                        date,
                        accountId,
                        StatsTransactionType.INCOME,
                        amount,
                        trx,
                    ),
                    await this._dailyIncomeStatsService.updateTotal(userId, date, incomeId, amount, trx),
                ]);
                const allSucceeded = response.every((r) => r === true);

                if (!allSucceeded) {
                    throw new DBError({ message: 'Not all incomes stats updates succeeded' });
                }
                return true;
            }
            case TransactionType.Expense: {
                const { accountId, categoryId, amount, date } = command.data;
                const response = await Promise.all([
                    await this._dailyStatsService.updateTotal(userId, date, StatsTransactionType.EXPENSE, amount, trx),
                    await this._dailyCategoryStatsService.updateTotal(userId, date, categoryId, amount, trx),
                    await this._dailyAccountStatsService.updateTotal(
                        userId,
                        date,
                        accountId,
                        StatsTransactionType.EXPENSE,
                        amount,
                        trx,
                    ),
                ]);
                const allSucceeded = response.every((r) => r === true);

                if (!allSucceeded) {
                    throw new DBError({ message: 'Not all expanse stats updates succeeded' });
                }
                return true;
            }
            case TransactionType.Transafer: {
                const { accountId, targetAccountId, date, amount } = command.data;
                const response = await Promise.all([
                    await this._dailyStatsService.updateTotal(userId, date, StatsTransactionType.TRANSFER, amount, trx),
                    await this._dailyAccountStatsService.updateTotal(
                        userId,
                        date,
                        accountId,
                        StatsTransactionType.EXPENSE,
                        amount,
                        trx,
                    ),
                    await this._dailyAccountStatsService.updateTotal(
                        userId,
                        date,
                        targetAccountId,
                        StatsTransactionType.INCOME,
                        amount,
                        trx,
                    ),
                    await this._dailyTransferStatsService.updateTotal(userId, date, accountId, targetAccountId, amount, trx),
                ]);
                const allSucceeded = response.every((r) => r === true);

                if (!allSucceeded) {
                    throw new DBError({ message: 'Not all transfer stats updates succeeded' });
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
                    before.amount !== after.amount ||
                    before.date !== after.date ||
                    before.accountId !== after.accountId ||
                    before?.incomeId !== after?.incomeId
                ) {
                    const response = await Promise.all([
                        await this._dailyStatsService.addToScore(userId, after.date, after.amount, 0, 0, trx),
                        await this._dailyIncomeStatsService.addToScore(userId, after.date, after.amount, after?.incomeId, trx),
                        await this._dailyAccountStatsService.addToScore(
                            userId,
                            after.date,
                            after.amount,
                            0,
                            after.accountId,
                            trx,
                        ),
                        await this._dailyStatsService.subtractFromScore(userId, before.date, before.amount, 0, 0, trx),
                        await this._dailyIncomeStatsService.subtractFromScore(
                            userId,
                            before.date,
                            before.amount,
                            before.incomeId,
                            trx,
                        ),
                        await this._dailyAccountStatsService.subtractFromScore(
                            userId,
                            before.date,
                            before.amount,
                            0,
                            before.accountId,
                            trx,
                        ),
                    ]);
                    const allSucceeded = response.every((r) => r === true);

                    if (!allSucceeded) {
                        throw new DBError({ message: 'Not all patch stats updates succeeded' });
                    }
                }
                return true;
            }
            case TransactionType.Expense: {
                if (
                    before.amount !== after.amount ||
                    before.date !== after.date ||
                    before.accountId !== after.accountId ||
                    before?.categoryId !== after?.categoryId
                ) {
                    const response = await Promise.all([
                        await this._dailyStatsService.addToScore(userId, after.date, 0, after.amount, 0, trx),
                        await this._dailyCategoryStatsService.addToScore(userId, after.date, after.amount, after.categoryId, trx),
                        await this._dailyAccountStatsService.addToScore(
                            userId,
                            after.date,
                            0,
                            after.amount,
                            after.accountId,
                            trx,
                        ),
                        await this._dailyStatsService.subtractFromScore(userId, before.date, 0, before.amount, 0, trx),
                        await this._dailyCategoryStatsService.subtractFromScore(
                            userId,
                            before.date,
                            before.amount,
                            before.categoryId,
                            trx,
                        ),
                        await this._dailyAccountStatsService.subtractFromScore(
                            userId,
                            before.date,
                            0,
                            before.amount,
                            before.accountId,
                            trx,
                        ),
                    ]);
                    const allSucceeded = response.every((r) => r === true);

                    if (!allSucceeded) {
                        throw new DBError({ message: 'Not all patch stats updates succeeded' });
                    }
                }
                return true;
            }
            case TransactionType.Transafer: {
                if (
                    before.amount !== after.amount ||
                    before.date !== after.date ||
                    before.accountId !== after.accountId ||
                    before?.targetAccountId !== after?.targetAccountId
                ) {
                    const response = await Promise.all([
                        await this._dailyStatsService.addToScore(userId, after.date, 0, 0, after.amount, trx),
                        await this._dailyAccountStatsService.addToScore(
                            userId,
                            after.date,
                            0,
                            after.amount,
                            after.accountId,
                            trx,
                        ),
                        await this._dailyAccountStatsService.addToScore(
                            userId,
                            after.date,
                            after.amount,
                            0,
                            after.targetAccountId,
                            trx,
                        ),
                        await this._dailyStatsService.subtractFromScore(userId, before.date, 0, 0, before.amount, trx),
                        await this._dailyAccountStatsService.subtractFromScore(
                            userId,
                            before.date,
                            0,
                            before.amount,
                            before.accountId,
                            trx,
                        ),
                        await this._dailyAccountStatsService.subtractFromScore(
                            userId,
                            before.date,
                            before.amount,
                            0,
                            before.targetAccountId,
                            trx,
                        ),
                    ]);
                    const allSucceeded = response.every((r) => r === true);

                    if (!allSucceeded) {
                        throw new DBError({ message: 'Not all patch stats updates succeeded' });
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
                    const { date, amount, accountId, incomeId } = data;
                    const response = await Promise.all([
                        await this._dailyStatsService.subtractFromScore(userId, date, amount, 0, 0, trx),
                        await this._dailyIncomeStatsService.subtractFromScore(userId, date, amount, incomeId, trx),
                        await this._dailyAccountStatsService.subtractFromScore(userId, date, amount, 0, accountId, trx),
                    ]);
                    const allSucceeded = response.every((r) => r === true);

                    if (!allSucceeded) {
                        throw new DBError({ message: 'Not all delete stats updates succeeded' });
                    }
                }
                return true;
            case TransactionType.Expense:
                {
                    const { date, amount, accountId, categoryId } = data;
                    const response = await Promise.all([
                        await this._dailyStatsService.subtractFromScore(userId, date, 0, amount, 0, trx),
                        await this._dailyCategoryStatsService.subtractFromScore(userId, date, amount, categoryId, trx),
                        await this._dailyAccountStatsService.subtractFromScore(userId, date, 0, amount, accountId, trx),
                    ]);
                    const allSucceeded = response.every((r) => r === true);

                    if (!allSucceeded) {
                        throw new DBError({ message: 'Not all delete stats updates succeeded' });
                    }
                }
                return true;
            case TransactionType.Transafer: {
                const { date, amount, accountId, targetAccountId } = data;
                const response = await Promise.all([
                    await this._dailyStatsService.subtractFromScore(userId, date, 0, 0, amount, trx),
                    await this._dailyAccountStatsService.subtractFromScore(userId, date, 0, amount, accountId, trx),
                    await this._dailyAccountStatsService.subtractFromScore(userId, date, amount, 0, targetAccountId, trx),
                ]);
                const allSucceeded = response.every((r) => r === true);

                if (!allSucceeded) {
                    throw new DBError({ message: 'Not all delete stats updates succeeded' });
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
    public async entityStats(userId: number, type: TransactionType, id: number, from: string, to: string): Promise<IEntityStats> {
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
            case TransactionType.Income: {
                const current = await this._dailyIncomeStatsService.summary(userId, id, startDate, endDate);
                const previous = await this._dailyIncomeStatsService.summary(userId, id, prevStartDate, prevEndDate);
                return {
                    spendMTD: current.total,
                    forecast: null,
                    vsLastMonthPct: Math.abs(current.total - previous.total),
                    budgetPct: 100,
                };
            }
            case TransactionType.Expense: {
                const current = await this._dailyAccountStatsService.summary(userId, id, startDate, endDate);
                const previous = await this._dailyAccountStatsService.summary(userId, id, prevStartDate, prevEndDate);
                return {
                    spendMTD: current.totalExpanse,
                    forecast: (current.totalExpanse / Time.getCurrentDayInMonth(startDate)) * Time.getDaysInMonth(startDate),
                    vsLastMonthPct: Math.abs(current.totalExpanse - previous.totalExpanse),
                    budgetPct: 100,
                };
            }
            case TransactionType.Transafer: {
                return {
                    spendMTD: 100,
                    forecast: 100,
                    vsLastMonthPct: 100,
                    budgetPct: 100,
                };
            }
            default: {
                throw new ValidationError({
                    statusCode: HttpCode.BAD_REQUEST,
                    errorCode: ErrorCode.STATS_ERROR,
                    message: `Transaction unsupported create transaction type: ${type}`,
                });
            }
        }
    }
}
