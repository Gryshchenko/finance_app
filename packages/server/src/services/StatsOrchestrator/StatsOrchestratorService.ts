import {
    ErrorCode,
    HttpCode,
    ICategoryStats,
    IEntityStats,
    IIncomeStats,
    IStatsResponse,
    ISummary,
    StatsPeriod,
    StatsType,
    Time,
} from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { ICategoryService } from 'services/category/CategoryService';
import { ICurrencyOrchestratorService } from 'services/currencyOrchestrator/CurrencyOrchestratorService';
import { IIncomeService } from 'services/income/IncomeService';
import { IProfileService } from 'services/profile/ProfileService';
import { ITransactionStatsBucket } from 'services/transaction/TransactionDataAccess';
import { ITransactionService } from 'services/transaction/TransactionService';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';

export interface IStatsOrchestratorService {
    summary(userId: number, from: string, to: string, period: StatsPeriod): Promise<ISummary>;
    entityStats(userId: number, type: StatsType, id: number, from: string, to: string): Promise<IEntityStats>;
    categoriesStats(userId: number, from: string, to: string): Promise<IStatsResponse<ICategoryStats>>;
    incomesStats(userId: number, from: string, to: string): Promise<IStatsResponse<IIncomeStats>>;
}

/**
 * Month-over-month percentage change.
 *
 * Returns `null` when the previous period is 0 while the current one is not: a jump
 * from zero has no finite percentage - it is neither "+100%" nor "+<amount>%" - so the
 * UI should render a "new" indicator / the absolute value instead of a misleading number.
 * When both periods are 0 the change is 0.
 */
const vsLastMonthPct = (current: number, previous: number): number | null => {
    const curr = Number(current);
    const prev = Number(previous);
    if (prev === 0) {
        return 0;
    }
    return Math.round(((curr - prev) / prev) * 100);
};

/** Round to at most 2 decimal places. */
const round2 = (value: number): number => Math.round(Number(value) * 100) / 100;

/** Sum native-amount buckets by type. Used for single-currency entity stats (no conversion). */
const sumBuckets = (buckets: ITransactionStatsBucket[]) =>
    buckets.reduce(
        (acc, bucket) => ({
            income: acc.income + bucket.income_total,
            expense: acc.expense + bucket.expense_total,
            transfer: acc.transfer + bucket.transfer_total,
        }),
        { income: 0, expense: 0, transfer: 0 },
    );

export default class StatsOrchestratorService extends LoggerBase implements IStatsOrchestratorService {
    private readonly _categoryService: ICategoryService;
    private readonly _incomeService: IIncomeService;
    private readonly _currencyOrchestratorService: ICurrencyOrchestratorService;
    private readonly _profileService: IProfileService;
    private readonly _transactionsService: ITransactionService;

    public constructor({
        categoryService,
        incomeService,
        currencyOrchestratorService,
        profileService,
        transactionsService,
    }: {
        currencyOrchestratorService: ICurrencyOrchestratorService;
        categoryService: ICategoryService;
        incomeService: IIncomeService;
        profileService: IProfileService;
        transactionsService: ITransactionService;
    }) {
        super();
        this._categoryService = categoryService;
        this._incomeService = incomeService;
        this._currencyOrchestratorService = currencyOrchestratorService;
        this._profileService = profileService;
        this._transactionsService = transactionsService;
    }

    public async summary(userId: number, from: string, to: string, _period: StatsPeriod): Promise<ISummary> {
        const baseCurrency = await this._profileService.getUserCurrencyCode(userId);
        const buckets = await this._transactionsService.getStats({ userId, from, to });

        let incomeTotal = 0;
        let expenseTotal = 0;
        let transferTotal = 0;

        // Each bucket is per (currency, day) in native amounts. Convert every bucket whose currency
        // differs from the user's base currency at that day's rate, then sum everything — including the
        // base-currency buckets — into one base-currency summary.
        for (const bucket of buckets) {
            const rate =
                bucket.currencyCode === baseCurrency ? 1 : await this.resolveRate(bucket.currencyCode, baseCurrency, bucket.date);
            incomeTotal += bucket.income_total * rate;
            expenseTotal += bucket.expense_total * rate;
            transferTotal += bucket.transfer_total * rate;
        }

        return {
            income_total: round2(incomeTotal),
            expense_total: round2(expenseTotal),
            transfer_total: round2(transferTotal),
            from,
            to,
        };
    }

    /**
     * Rate to convert `fromCurrency` into `toCurrency` for `date`. CurrencyOrchestrator returns the
     * historical rate for that day, falling back to any rate already stored for the pair. Throws when
     * no rate exists at all (rather than silently dropping or zeroing the bucket).
     */
    private async resolveRate(fromCurrency: string, toCurrency: string, date: string): Promise<number> {
        const rate = await this._currencyOrchestratorService.get(fromCurrency, toCurrency, date);
        if (rate && Number(rate.rate) > 0) {
            return Number(rate.rate);
        }
        throw new CustomError({
            statusCode: HttpCode.INTERNAL_SERVER_ERROR,
            errorCode: ErrorCode.STATS_ERROR,
            message: `No exchange rate to convert ${fromCurrency} -> ${toCurrency} for ${date}`,
        });
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
        // An entity (income/category/account) has a single currency, so its stats need no conversion.
        switch (type) {
            case StatsType.Income: {
                const current = sumBuckets(
                    await this._transactionsService.getStats({ userId, from: startDate, to: endDate, incomeId: id }),
                );
                const previous = sumBuckets(
                    await this._transactionsService.getStats({ userId, from: prevStartDate, to: prevEndDate, incomeId: id }),
                );
                return {
                    incomeMTD: round2(current.income),
                    vsLastMonthIncomePct: vsLastMonthPct(current.income, previous.income),
                };
            }
            case StatsType.Expense: {
                const category = await this._categoryService.get(userId, id);
                const budget = category?.budget ?? 0;
                const current = sumBuckets(
                    await this._transactionsService.getStats({ userId, from: startDate, to: endDate, categoryId: id }),
                );
                const previous = sumBuckets(
                    await this._transactionsService.getStats({ userId, from: prevStartDate, to: prevEndDate, categoryId: id }),
                );

                return {
                    spendMTD: round2(current.expense),
                    vsLastMonthSpendPct: vsLastMonthPct(current.expense, previous.expense),
                    budgetTotal: budget > 0 ? round2(budget) : undefined,
                };
            }
            case StatsType.Account: {
                const current = sumBuckets(
                    await this._transactionsService.getStats({ userId, from: startDate, to: endDate, accountId: id }),
                );
                const previous = sumBuckets(
                    await this._transactionsService.getStats({ userId, from: prevStartDate, to: prevEndDate, accountId: id }),
                );

                // Average month-end savings rate, year-to-date: mean of (income − expense) / income per month.
                // Only months with income contribute; the current (partial) month is included. We need at least
                // two such months to show a meaningful average - fewer ⇒ null (UI shows "no data").
                const yearStart = Time.toYearStart(from);
                const yearBuckets = yearStart
                    ? await this._transactionsService.getStats({ userId, from: yearStart, to: endDate, accountId: id })
                    : [];
                const byMonth = new Map<string, { income: number; expense: number }>();
                for (const bucket of yearBuckets) {
                    const month = bucket.date.slice(0, 7); // YYYY-MM
                    const acc = byMonth.get(month) ?? { income: 0, expense: 0 };
                    acc.income += bucket.income_total;
                    acc.expense += bucket.expense_total;
                    byMonth.set(month, acc);
                }
                const monthlySavingsRates = [...byMonth.values()]
                    .filter((month) => month.income > 0)
                    .map((month) => ((month.income - month.expense) / month.income) * 100);
                const savingsRate =
                    monthlySavingsRates.length >= 2
                        ? round2(monthlySavingsRates.reduce((sum, rate) => sum + rate, 0) / monthlySavingsRates.length)
                        : null;
                return {
                    spendMTD: round2(current.expense),
                    vsLastMonthSpendPct: vsLastMonthPct(current.expense, previous.expense),
                    transferMTD: round2(current.transfer),
                    incomeMTD: round2(current.income),
                    vsLastMonthIncomePct: vsLastMonthPct(current.income, previous.income),
                    savingsRate,
                };
            }
            default: {
                throw new ValidationError({
                    statusCode: HttpCode.BAD_REQUEST,
                    errorCode: ErrorCode.STATS_ERROR,
                    message: `Transaction unsupported create stats type: ${type}`,
                });
            }
        }
    }

    public async categoriesStats(userId: number, from: string, to: string): Promise<IStatsResponse<ICategoryStats>> {
        const categories = (await this._categoryService.gets(userId)) ?? [];
        const buckets = await this._transactionsService.getStatsByEntity({ userId, from, to, groupBy: 'categoryId' });

        // A category's spend lives in expense_total; each category is single-currency, so no conversion.
        // Start from the full category list so categories with no transactions still appear with amount 0.
        const amountByCategory = new Map<number, number>();
        for (const bucket of buckets) {
            amountByCategory.set(bucket.entityId, (amountByCategory.get(bucket.entityId) ?? 0) + bucket.expense_total);
        }

        const items: ICategoryStats[] = categories.map((category) => ({
            ...category,
            amount: round2(amountByCategory.get(category.categoryId) ?? 0),
        }));
        // NOTE: total is a naive sum of native amounts (matches the previous behaviour); for a
        // multi-currency user it is not converted to a single base currency.
        const total = round2(items.reduce((sum, item) => sum + item.amount, 0));
        return { from, to, items, total };
    }

    public async incomesStats(userId: number, from: string, to: string): Promise<IStatsResponse<IIncomeStats>> {
        const incomes = (await this._incomeService.gets(userId)) ?? [];
        const buckets = await this._transactionsService.getStatsByEntity({ userId, from, to, groupBy: 'incomeId' });

        const amountByIncome = new Map<number, number>();
        for (const bucket of buckets) {
            amountByIncome.set(bucket.entityId, (amountByIncome.get(bucket.entityId) ?? 0) + bucket.income_total);
        }

        const items: IIncomeStats[] = incomes.map((income) => ({
            ...income,
            amount: round2(amountByIncome.get(income.incomeId) ?? 0),
        }));
        const total = round2(items.reduce((sum, item) => sum + item.amount, 0));
        return { from, to, items, total };
    }
}
