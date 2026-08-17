import { DateTime, HttpCode, StatsPeriod, StatsScope, StatsType } from '@tenpercent/shared';

import config from '../../src/config/dbConfig';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import { closeTestApp, createUser, generateSecureRandom } from '../TestsUtils.';
import { createExpenseTransaction, createIncomeTransaction } from '../transactions/TransactionsTestUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

/**
 * A ten-month straight line, walked in both directions.
 *
 * Each month gets exactly one full chain - income -> account -> category - for the same
 * amount, so the account ends every month where it started and the only thing that moves
 * is the monthly total. The rising user goes 100, 110, 120 ... 190; the falling one goes
 * 110, 100, 90 ... 20. Every step is therefore a flat +10 / -10, and the tests assert that
 * step both as an absolute month-over-month difference and as the percentage the
 * entityStats endpoint reports against the previous month.
 *
 * Transactions land on the 15th on purpose: entityStats compares against
 * [previous month 01 .. this month 01] inclusive, so anything booked on the 1st would be
 * counted by both windows.
 */

let server: never;
const userIds: number[] = [];
const db = DatabaseConnection.instance(config);

const agent = () => request.agent(server);

const MONTHS = 10;
const STEP = 10;
const ACCOUNT_SEED = 5000;

/** January .. October 2025 - inside one year, and safely in the past. */
const monthFrom = (index: number): string => DateTime.utc(2025, index + 1, 1).toISO() as string;
const monthTo = (index: number): string =>
    DateTime.utc(2025, index + 1, 1)
        .endOf('month')
        .toISO() as string;
const monthTxDate = (index: number): string => DateTime.utc(2025, index + 1, 15, 11).toISO() as string;

const risingAmount = (index: number): number => 100 + STEP * index;
const fallingAmount = (index: number): number => 110 - STEP * index;

interface ISeries {
    userId: number;
    auth: string;
    accountId: number;
    categoryId: number;
    incomeId: number;
    amounts: number[];
}

let rising: ISeries;
let falling: ISeries;

const createAccount = (uid: number, auth: string, accountName: string, amount: number) =>
    agent()
        .post(`/user/${uid}/account`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', accountName, amount, iconId: 'wallet' })
        .expect(HttpCode.OK);

const createCategory = (uid: number, auth: string, categoryName: string) =>
    agent()
        .post(`/user/${uid}/category`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', categoryName, iconId: 'wallet' })
        .expect(HttpCode.OK);

const createIncome = (uid: number, auth: string, incomeName: string) =>
    agent()
        .post(`/user/${uid}/income`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', incomeName, iconId: 'bnb' })
        .expect(HttpCode.OK);

const summaryOf = async (series: ISeries, index: number): Promise<{ income_total: number; expense_total: number }> => {
    const { body } = await agent()
        .get(
            `/user/${series.userId}/stats/summary?from=${monthFrom(index)}&to=${monthTo(index)}&period=${StatsPeriod.Month}&scope=${StatsScope.Own}`,
        )
        .set('authorization', series.auth)
        .expect(HttpCode.OK);
    return body.data;
};

const entityStatsOf = async (
    series: ISeries,
    index: number,
    type: StatsType,
): Promise<{
    incomeMTD?: number;
    spendMTD?: number;
    vsLastMonthIncomePct?: number | null;
    vsLastMonthSpendPct?: number | null;
}> => {
    const entityId = type === StatsType.Income ? series.incomeId : series.categoryId;
    const { body } = await agent()
        .get(
            `/user/${series.userId}/stats/entityStats/${entityId}?from=${monthFrom(index)}&to=${monthTo(index)}&period=${StatsPeriod.Month}&type=${type}`,
        )
        .set('authorization', series.auth)
        .expect(HttpCode.OK);
    return body.data;
};

/**
 * One user, one account, one income, one category, and `amounts.length` months of
 * income -> account -> category for the amount of that month.
 */
const seedSeries = async (label: string, amounts: number[]): Promise<ISeries> => {
    const seriesAgent = agent();
    const { userId, authorization } = await createUser({ agent: seriesAgent, databaseConnection: db });
    userIds.push(userId);

    const accountId = (await createAccount(userId, authorization, `${label} account`, ACCOUNT_SEED)).body.data.accountId;
    const categoryId = (await createCategory(userId, authorization, `${label} category`)).body.data.categoryId;
    const incomeId = (await createIncome(userId, authorization, `${label} income`)).body.data.incomeId;

    for (const [index, amount] of amounts.entries()) {
        const createdAt = monthTxDate(index);
        await createIncomeTransaction(seriesAgent, userId, authorization, accountId, incomeId, 'USD', amount, createdAt);
        await createExpenseTransaction(seriesAgent, userId, authorization, accountId, categoryId, 'USD', amount, createdAt);
    }

    return { userId, auth: authorization, accountId, categoryId, incomeId, amounts };
};

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-expect-error listen returns a Server the util accepts as never
    server = app.listen(port);

    rising = await seedSeries(
        'Rising',
        Array.from({ length: MONTHS }, (_, index) => risingAmount(index)),
    );
    falling = await seedSeries(
        'Falling',
        Array.from({ length: MONTHS }, (_, index) => fallingAmount(index)),
    );
});

afterAll(async () => {
    await db.engine()('transactions').whereIn('userId', userIds).delete();
    await closeTestApp(server, userIds);
});

const months = Array.from({ length: MONTHS }, (_, index) => index);
const stepMonths = months.slice(1);

describe.each([
    ['rising by +10 a month', () => rising, STEP],
    ['falling by -10 a month', () => falling, -STEP],
])('Monthly trend - %s', (_name, seriesOf, step) => {
    it.each(months)('month %i totals exactly the amount booked that month', async (index) => {
        const series = seriesOf();
        const summary = await summaryOf(series, index);

        expect(summary.income_total).toBe(series.amounts[index]);
        expect(summary.expense_total).toBe(series.amounts[index]);
    });

    it.each(stepMonths)('month %i moves by the step against the month before it', async (index) => {
        const series = seriesOf();
        const current = await summaryOf(series, index);
        const previous = await summaryOf(series, index - 1);
        console.log({ current, previous });

        expect(current.income_total - previous.income_total).toBe(step);
        expect(current.expense_total - previous.expense_total).toBe(step);
    });

    it.each(stepMonths)('month %i reports the step as an income percentage of the month before', async (index) => {
        const series = seriesOf();
        const data = await entityStatsOf(series, index, StatsType.Income);
        const expectedPct = Math.round((step / series.amounts[index - 1]) * 100);

        expect(data.incomeMTD).toBe(series.amounts[index]);
        expect(data.vsLastMonthIncomePct).toBe(expectedPct);
    });

    it.each(stepMonths)('month %i reports the step as a spend percentage of the month before', async (index) => {
        const series = seriesOf();
        const data = await entityStatsOf(series, index, StatsType.Expense);
        const expectedPct = Math.round((step / series.amounts[index - 1]) * 100);

        expect(data.spendMTD).toBe(series.amounts[index]);
        expect(data.vsLastMonthSpendPct).toBe(expectedPct);
    });

    it('the first month has no month before it, so there is no change to report', async () => {
        const series = seriesOf();
        const income = await entityStatsOf(series, 0, StatsType.Income);
        const expense = await entityStatsOf(series, 0, StatsType.Expense);

        expect(income.incomeMTD).toBe(series.amounts[0]);
        expect(income.vsLastMonthIncomePct).toBe(0);
        expect(expense.spendMTD).toBe(series.amounts[0]);
        expect(expense.vsLastMonthSpendPct).toBe(0);
    });

    it('the whole run cancels itself out, so the account never left its starting amount', async () => {
        const series = seriesOf();
        const { body } = await agent()
            .get(`/user/${series.userId}/balance`)
            .set('authorization', series.auth)
            .expect(HttpCode.OK);

        expect(body.data.balance).toBe(ACCOUNT_SEED);
    });

    it('a month with nothing booked in it stays at zero', async () => {
        const series = seriesOf();
        const { body } = await agent()
            .get(
                `/user/${series.userId}/stats/summary?from=${DateTime.utc(2024, 6, 1).toISO()}&to=${DateTime.utc(2024, 6, 30).toISO()}&period=${StatsPeriod.Month}`,
            )
            .set('authorization', series.auth)
            .expect(HttpCode.OK);

        expect(body.data.income_total).toBe(0);
        expect(body.data.expense_total).toBe(0);
    });
});
