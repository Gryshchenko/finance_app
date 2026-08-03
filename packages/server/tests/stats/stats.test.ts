import { closeTestApp, createUser, deleteUserAfterTest, generateRandomNumber, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode, ICategory, IIncome, StatsPeriod, StatsType, Time, Utils } from '@tenpercent/shared';
import {
    createExpenseTransaction,
    createExpenseTransactions,
    createIncomeTransaction,
    createIncomeTransactions,
    createTransferTransaction,
    createTransferTransactions,
    deleteTransaction,
    patchExpenseTransaction,
    patchTransaction,
} from '../transactions/TransactionsTestUtils';
import { getCategoriesWithStats, getEntityStats, getIncomesWithStats, getSummary } from './StatsTestUtils';
import { createAccount } from '../account/AccountTestUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

let server: never;
let userIds: number[] = [];

const DEC_FROM = '2025-12-01T00:00:00.000Z';
const DEC_TO = '2025-12-31T00:00:00.000Z';
const NOV_FROM = '2025-11-01T00:00:00.000Z';
const NOV_TO = '2025-11-30T00:00:00.000Z';
const NOV_DATE = Time.jsDateToUTCISO(new Date('2025-11-01T11:00:00'));
const DEC_DATE = Time.jsDateToUTCISO(new Date('2025-12-15T11:00:00'));

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-expect-error is necessary
    server = app.listen(port);
});

afterAll(async () => {
    await closeTestApp(server, userIds);
});

interface ITestCtx {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agent: any;
    userId: number;
    authorization: string;
    accountId: number;
    targetAccountId: number;
    currencyCode: string;
    incomeIds: number[];
    categoryIds: number[];
}

async function setupUser(): Promise<ITestCtx> {
    const agent = request.agent(server);
    const databaseConnection = DatabaseConnection.instance(config);
    const { userId, authorization } = await createUser({ agent, databaseConnection });
    userIds.push(userId);

    const {
        body: {
            data: { accounts, categories, incomes },
        },
    } = await agent.get(`/user/${userId}/overview/`).set('authorization', authorization).send({}).expect(HttpCode.OK);

    // entityStats expects a category budget; server returns budgetTotal only when budget > 0
    await agent
        .patch(`/user/${userId}/category/${categories[0].categoryId}`)
        .set('authorization', authorization)
        .send({ budget: 100 })
        .expect(HttpCode.NO_CONTENT);

    const targetAccountId = await createAccount(agent, userId, authorization, accounts[0].currencyCode, 0, 'Transfer target');

    return {
        agent,
        userId,
        authorization,
        accountId: accounts[0].accountId,
        targetAccountId,
        currencyCode: accounts[0].currencyCode,
        incomeIds: incomes.map((i: IIncome) => i.incomeId),
        categoryIds: categories.map((c: ICategory) => c.categoryId),
    };
}

// Seeds 30 days of December (one expense + income + transfer per day, 100 each).
async function seedDecember(ctx: ITestCtx) {
    const dates: string[] = Array.from({ length: 30 }).map((_: unknown, index) => {
        const counter = index + 1;
        const str = counter <= 9 ? `0${counter}` : counter;
        return `2025-12-${str}T11:00:00`;
    });
    const expenseIds: number[] = [];
    const incomeResultIds: number[] = [];
    const transferIds: number[] = [];

    for (const date of dates) {
        const catId = ctx.categoryIds[generateRandomNumber(0, ctx.categoryIds.length - 1)];
        const incId = ctx.incomeIds[generateRandomNumber(0, ctx.incomeIds.length - 1)];
        const utc = Time.jsDateToUTCISO(new Date(date));

        const [e] = await createExpenseTransactions(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            catId,
            ctx.currencyCode,
            100,
            1,
            utc,
        );
        const [i] = await createIncomeTransactions(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            incId,
            ctx.currencyCode,
            100,
            1,
            utc,
        );
        const [t] = await createTransferTransactions(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.targetAccountId,
            ctx.currencyCode,
            100,
            1,
            utc,
        );
        expenseIds.push(e);
        incomeResultIds.push(i);
        transferIds.push(t);
    }
    return { expenseIds, incomeResultIds, transferIds, total: 30 * 100 };
}

describe('Stats - month aggregations (full seed)', () => {
    it('initial totals match seeded transactions', async () => {
        const ctx = await setupUser();
        const { total } = await seedDecember(ctx);

        const cats = await getCategoriesWithStats(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(cats.from).toEqual(DEC_FROM);
        expect(cats.to).toEqual(DEC_TO);
        expect(cats.total).toEqual(total);

        const incs = await getIncomesWithStats(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(incs.total).toEqual(total);

        const summary = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(summary.expense_total)).toEqual(total);
        expect(Utils.roundNumber(summary.income_total)).toEqual(total);
        expect(Utils.roundNumber(summary.transfer_total)).toEqual(total);
    });

    it('patch amount updates stats within same period', async () => {
        const ctx = await setupUser();
        const { total, expenseIds, incomeResultIds, transferIds } = await seedDecember(ctx);

        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, expenseIds[0], { amount: 50, targetAmount: 50 });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, incomeResultIds[0], { amount: 50, targetAmount: 50 });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, transferIds[0], { amount: 50, targetAmount: 50 });

        const summary = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(summary.expense_total)).toEqual(total - 50);
        expect(Utils.roundNumber(summary.income_total)).toEqual(total - 50);
        expect(Utils.roundNumber(summary.transfer_total)).toEqual(total - 50);

        const cats = await getCategoriesWithStats(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(cats.total).toEqual(total - 50);

        const incs = await getIncomesWithStats(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(incs.total).toEqual(total - 50);
    });

    it('patch createdAt moves transaction between periods', async () => {
        const ctx = await setupUser();
        const { total, expenseIds, incomeResultIds, transferIds } = await seedDecember(ctx);

        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, expenseIds[0], { amount: 50 });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, incomeResultIds[0], { amount: 50 });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, transferIds[0], { amount: 50 });

        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, expenseIds[0], { createdAt: NOV_DATE });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, incomeResultIds[0], { createdAt: NOV_DATE });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, transferIds[0], { createdAt: NOV_DATE });

        const dec = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(dec.expense_total)).toEqual(total - 100);
        expect(Utils.roundNumber(dec.income_total)).toEqual(total - 100);
        expect(Utils.roundNumber(dec.transfer_total)).toEqual(total - 100);

        const nov = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: NOV_FROM,
            to: NOV_TO,
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(nov.expense_total)).toEqual(50);
        expect(Utils.roundNumber(nov.income_total)).toEqual(50);
        expect(Utils.roundNumber(nov.transfer_total)).toEqual(50);
    });

    it('delete removes from period and does NOT affect other periods', async () => {
        const ctx = await setupUser();
        const { total, expenseIds, incomeResultIds, transferIds } = await seedDecember(ctx);

        // move first of each to November (with amount=50)
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, expenseIds[0], { amount: 50 });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, incomeResultIds[0], { amount: 50 });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, transferIds[0], { amount: 50 });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, expenseIds[0], { createdAt: NOV_DATE });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, incomeResultIds[0], { createdAt: NOV_DATE });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, transferIds[0], { createdAt: NOV_DATE });

        await deleteTransaction(ctx.agent, ctx.userId, ctx.authorization, { transactionId: expenseIds[0] });
        await deleteTransaction(ctx.agent, ctx.userId, ctx.authorization, { transactionId: incomeResultIds[0] });
        await deleteTransaction(ctx.agent, ctx.userId, ctx.authorization, { transactionId: transferIds[0] });

        const nov = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: NOV_FROM,
            to: NOV_TO,
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(nov.expense_total)).toEqual(0);
        expect(Utils.roundNumber(nov.income_total)).toEqual(0);
        expect(Utils.roundNumber(nov.transfer_total)).toEqual(0);

        // December must remain at total - 100 (we removed only the moved-out trio)
        const dec = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(dec.expense_total)).toEqual(total - 100);
        expect(Utils.roundNumber(dec.income_total)).toEqual(total - 100);
        expect(Utils.roundNumber(dec.transfer_total)).toEqual(total - 100);
    });
});

describe('Stats - patch reattribution (light setup)', () => {
    it('patch categoryId moves expense between categories without changing total', async () => {
        const ctx = await setupUser();
        const [catA, catB] = ctx.categoryIds;

        const id = await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            catA,
            ctx.currencyCode,
            100,
            DEC_DATE,
        );

        const before = await getCategoriesWithStats(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(before.total).toEqual(100);

        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, id, { categoryId: catB });

        const after = await getCategoriesWithStats(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(after.total).toEqual(100);
    });

    it('patch incomeId moves income between income buckets without changing total', async () => {
        const ctx = await setupUser();
        if (ctx.incomeIds.length < 2) return; // requires >=2 incomes
        const [incA, incB] = ctx.incomeIds;

        const id = await createIncomeTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            incA,
            ctx.currencyCode,
            100,
            DEC_DATE,
        );

        const before = await getIncomesWithStats(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(before.total).toEqual(100);

        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, id, { incomeId: incB });

        const after = await getIncomesWithStats(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(after.total).toEqual(100);
    });

    it('combined amount + createdAt patch moves transaction with new amount to new period', async () => {
        const ctx = await setupUser();
        const id = await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            100,
            DEC_DATE,
        );

        // single patch: change amount AND move to November
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, id, {
            amount: 30,
            createdAt: NOV_DATE,
        });

        const dec = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        const nov = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: NOV_FROM,
            to: NOV_TO,
            period: StatsPeriod.Month,
        });

        expect(Utils.roundNumber(dec.expense_total)).toEqual(0);
        expect(Utils.roundNumber(nov.expense_total)).toEqual(30);
    });

    it('patch description (metadata-only) does not change any stats', async () => {
        const ctx = await setupUser();
        const id = await createTransferTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.targetAccountId,
            ctx.currencyCode,
            100,
            DEC_DATE,
        );

        const before = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(before.transfer_total)).toEqual(100);

        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, id, { description: 'metadata only' });

        const after = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(after.transfer_total)).toEqual(100);
        expect(Utils.roundNumber(after.expense_total)).toEqual(0);
        expect(Utils.roundNumber(after.income_total)).toEqual(0);
    });

    it('boundary: transaction outside [from..to] is not counted', async () => {
        const ctx = await setupUser();
        // inside December
        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            100,
            Time.jsDateToUTCISO(new Date('2025-12-30T11:00:00')),
        );
        // far outside (next year)
        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            200,
            Time.jsDateToUTCISO(new Date('2026-01-05T11:00:00')),
        );

        const dec = await getSummary(ctx.agent, ctx.userId, ctx.authorization, {
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(dec.expense_total)).toEqual(100);
    });

    it('entityStats expense - month', async () => {
        const ctx = await setupUser();
        const ids = [];
        for (let i = 1; i <= 29; i++) {
            await createExpenseTransaction(
                ctx.agent,
                ctx.userId,
                ctx.authorization,
                ctx.accountId,
                ctx.categoryIds[0],
                ctx.currencyCode,
                100,
                Time.jsDateToUTCISO(new Date(`2025-12-${i < 10 ? `0${i}` : i}T11:00:00`)),
            );
            if (i % 2 === 0) {
                const id = await createExpenseTransaction(
                    ctx.agent,
                    ctx.userId,
                    ctx.authorization,
                    ctx.accountId,
                    ctx.categoryIds[0],
                    ctx.currencyCode,
                    100,
                    Time.jsDateToUTCISO(new Date(`2025-11-${i < 10 ? `0${i}` : i}T11:00:00`)),
                );
                ids.push(id);
            }
        }
        const data = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.categoryIds[0],
            from: '2025-12-01T00:00:00.000Z',
            to: '2025-12-31T00:00:00.000Z',
            period: StatsPeriod.Month,
            type: StatsType.Expense,
        });

        // Nov has 14 txns × 100 = 1400, BUT prev-range [Nov-01..Dec-01] also captures
        // the Dec-01 daily-aggregate row (boundary inclusive on date column) → +100.
        // So prev = 1500. round((2900-1500)/1500*100) = 93.
        expect(data).toEqual({ spendMTD: 2900, vsLastMonthSpendPct: 93, budgetTotal: 100 });

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            await patchExpenseTransaction(ctx.agent, ctx.userId, ctx.authorization, id, 50);
        }

        const dataAfterPatch = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.categoryIds[0],
            from: '2025-12-01T00:00:00.000Z',
            to: '2025-12-31T00:00:00.000Z',
            period: StatsPeriod.Month,
            type: StatsType.Expense,
        });

        // Nov patched 14×50 = 700 + Dec-01 leak 100 = 800 → round((2900-800)/800*100) = 263
        expect(dataAfterPatch).toEqual({ spendMTD: 2900, vsLastMonthSpendPct: 263, budgetTotal: 100 });

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const day = i + 1;
            await patchExpenseTransaction(
                ctx.agent,
                ctx.userId,
                ctx.authorization,
                id,
                100,
                Time.jsDateToUTCISO(new Date(`2026-01-${day < 10 ? `0${day}` : day}T11:00:00`)),
            );
        }

        const dataAfterDatePatch = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.categoryIds[0],
            from: '2025-12-01T00:00:00.000Z',
            to: '2025-12-31T00:00:00.000Z',
            period: StatsPeriod.Month,
            type: StatsType.Expense,
        });

        // All 14 Nov txns moved to Jan 2026; Dec-01 leak (100) still in prev range.
        // (2900-100)/100*100 = 2800
        expect(dataAfterDatePatch).toEqual({ spendMTD: 2900, vsLastMonthSpendPct: 2800, budgetTotal: 100 });
    });
});

describe('entityStats - Expense edge cases', () => {
    it('returns 0 pct when both periods are empty', async () => {
        const ctx = await setupUser();
        const data = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.categoryIds[0],
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Expense,
        });
        expect(data).toEqual({ spendMTD: 0, vsLastMonthSpendPct: 0, budgetTotal: 100 });
    });

    it('returns null pct when previous=0 and current>0 (first month, no comparable base)', async () => {
        const ctx = await setupUser();
        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            500,
            DEC_DATE,
        );
        const data = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.categoryIds[0],
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Expense,
        });
        expect(data).toEqual({ spendMTD: 500, vsLastMonthSpendPct: 0, budgetTotal: 100 });
    });

    it('returns negative pct when spending decreased', async () => {
        const ctx = await setupUser();
        // November: 1000, December: 250 → (250-1000)/1000*100 = -75
        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            1000,
            NOV_DATE,
        );
        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            250,
            DEC_DATE,
        );

        const data = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.categoryIds[0],
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Expense,
        });
        expect(data).toEqual({ spendMTD: 250, vsLastMonthSpendPct: -75, budgetTotal: 100 });
    });

    it('isolates stats by categoryId - other categories are not counted', async () => {
        const ctx = await setupUser();
        if (ctx.categoryIds.length < 2) return;
        const [catA, catB] = ctx.categoryIds;

        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            catA,
            ctx.currencyCode,
            300,
            DEC_DATE,
        );
        // Different category - must NOT be included in catA stats
        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            catB,
            ctx.currencyCode,
            900,
            DEC_DATE,
        );

        const dataA = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: catA,
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Expense,
        });
        expect(dataA.spendMTD).toEqual(300);

        const dataB = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: catB,
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Expense,
        });
        expect(dataB.spendMTD).toEqual(900);
    });

    it('recalculates correctly after delete', async () => {
        const ctx = await setupUser();
        const id1 = await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            400,
            DEC_DATE,
        );
        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            600,
            DEC_DATE,
        );

        const before = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.categoryIds[0],
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Expense,
        });
        expect(before.spendMTD).toEqual(1000);

        await deleteTransaction(ctx.agent, ctx.userId, ctx.authorization, { transactionId: id1 });

        const after = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.categoryIds[0],
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Expense,
        });
        expect(after.spendMTD).toEqual(600);
    });
});

describe('entityStats - Income', () => {
    it('returns incomeMTD and vsLastMonthIncomePct, no expense fields', async () => {
        const ctx = await setupUser();
        const incId = ctx.incomeIds[0];

        await createIncomeTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            incId,
            ctx.currencyCode,
            800,
            NOV_DATE,
        );
        await createIncomeTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            incId,
            ctx.currencyCode,
            1200,
            DEC_DATE,
        );

        const data = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: incId,
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Income,
        });

        // (1200 - 800) / 800 * 100 = 50
        expect(data).toEqual({ incomeMTD: 1200, vsLastMonthIncomePct: 50 });
        expect(data).not.toHaveProperty('spendMTD');
        expect(data).not.toHaveProperty('budgetTotal');
    });

    it('returns 0/0 when both periods empty', async () => {
        const ctx = await setupUser();
        const data = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.incomeIds[0],
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Income,
        });
        expect(data).toEqual({ incomeMTD: 0, vsLastMonthIncomePct: 0 });
    });

    it('returns negative pct when income decreased', async () => {
        const ctx = await setupUser();
        const incId = ctx.incomeIds[0];
        // November: 1000, December: 400 → (400-1000)/1000*100 = -60
        await createIncomeTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            incId,
            ctx.currencyCode,
            1000,
            NOV_DATE,
        );
        await createIncomeTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            incId,
            ctx.currencyCode,
            400,
            DEC_DATE,
        );

        const data = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: incId,
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Income,
        });
        expect(data).toEqual({ incomeMTD: 400, vsLastMonthIncomePct: -60 });
    });
});

describe('entityStats - Account', () => {
    it('returns all 5 fields with correct values and savingsRate formula', async () => {
        const ctx = await setupUser();
        // November (previous): expenses=200, income=500
        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            200,
            NOV_DATE,
        );
        await createIncomeTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.incomeIds[0],
            ctx.currencyCode,
            500,
            NOV_DATE,
        );
        // December (current): expenses=300, income=1000, transfer=150
        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            300,
            DEC_DATE,
        );
        await createIncomeTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.incomeIds[0],
            ctx.currencyCode,
            1000,
            DEC_DATE,
        );
        await createTransferTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.targetAccountId,
            ctx.currencyCode,
            150,
            DEC_DATE,
        );

        const data = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.accountId,
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Account,
        });

        // Read-time model keeps transfers separate from spend: a transfer between your own accounts
        // is not "spending", so it lands in transferMTD, never folded into spendMTD/expense_total.
        // Nov spend = 200, Dec spend = 300 → vsLastMonthSpendPct = round((300-200)/200*100) = 50.
        expect(data.vsLastMonthSpendPct).toEqual(50);
        expect(Number(data.spendMTD)).toEqual(300);
        expect(Number(data.transferMTD)).toEqual(150);

        // Dec income = 1000; Nov income = 500 → vsLastMonthIncomePct = round((1000-500)/500*100) = 100.
        expect(Number(data.incomeMTD)).toEqual(1000);
        expect(data.vsLastMonthIncomePct).toEqual(100);
        // Average month-end savings rate YTD across months with income (Nov, Dec), expense-only:
        //   Nov: (500-200)/500 = 60%   Dec: (1000-300)/1000 = 70%   → mean = 65%
        expect(Number(data.savingsRate)).toBeCloseTo(65, 5);
    });

    it('returns null savingsRate when only one month has income (needs >= 2 months)', async () => {
        const ctx = await setupUser();
        // Only December has activity → a single month → not enough to average.
        await createIncomeTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.incomeIds[0],
            ctx.currencyCode,
            1000,
            DEC_DATE,
        );
        await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            ctx.categoryIds[0],
            ctx.currencyCode,
            400,
            DEC_DATE,
        );
        const data = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.accountId,
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Account,
        });
        // One month with income is not enough to average → no data.
        expect(data.savingsRate).toBeNull();
        expect(Number(data.incomeMTD)).toEqual(1000);
    });

    it('returns zero values when no activity in either period', async () => {
        const ctx = await setupUser();
        const data = await getEntityStats(ctx.agent, ctx.userId, ctx.authorization, {
            id: ctx.accountId,
            from: DEC_FROM,
            to: DEC_TO,
            period: StatsPeriod.Month,
            type: StatsType.Account,
        });
        expect(data.vsLastMonthSpendPct).toEqual(0);
        expect(data.vsLastMonthIncomePct).toEqual(0);
        expect(Number(data.spendMTD)).toEqual(0);
        expect(Number(data.incomeMTD)).toEqual(0);
        expect(Number(data.transferMTD)).toEqual(0);
        expect(data.savingsRate).toBeNull();
    });
});
