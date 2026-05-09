import { createUser, deleteUserAfterTest, generateRandomNumber, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode, ICategory, IIncome, StatsPeriod, Time, Utils } from 'tenpercent/shared';
import {
    createExpenseTransaction,
    createExpenseTransactions,
    createIncomeTransaction,
    createIncomeTransactions,
    createTransferTransaction,
    createTransferTransactions,
    deleteTransaction,
    patchTransaction,
} from '../transactions/TransactionsTestUtils';
import { getCategoriesWithStats, getIncomesWithStats, getSummary } from './StatsTestUtils';

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

afterAll((done) => {
    userIds.forEach(async (id) => {
        await deleteUserAfterTest(id, DatabaseConnection.instance(config));
    });
    userIds = [];
    // @ts-expect-error is necessary
    server.closeAllConnections();
    // @ts-expect-error is necessary
    server.close(done);
});

interface ITestCtx {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agent: any;
    userId: number;
    authorization: string;
    accountId: number;
    targetAccountId: number;
    currencyId: number;
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

    return {
        agent,
        userId,
        authorization,
        accountId: accounts[0].accountId,
        targetAccountId: accounts[1].accountId,
        currencyId: accounts[0].currencyId,
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
            ctx.currencyId,
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
            ctx.currencyId,
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
            ctx.currencyId,
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

describe('Stats — month aggregations (full seed)', () => {
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

        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, expenseIds[0], { amount: 50 });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, incomeResultIds[0], { amount: 50 });
        await patchTransaction(ctx.agent, ctx.userId, ctx.authorization, transferIds[0], { amount: 50 });

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

describe('Stats — patch reattribution (light setup)', () => {
    it('patch categoryId moves expense between categories without changing total', async () => {
        const ctx = await setupUser();
        const [catA, catB] = ctx.categoryIds;

        const id = await createExpenseTransaction(
            ctx.agent,
            ctx.userId,
            ctx.authorization,
            ctx.accountId,
            catA,
            ctx.currencyId,
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
            ctx.currencyId,
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
            ctx.currencyId,
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
            ctx.currencyId,
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
            ctx.currencyId,
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
            ctx.currencyId,
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
});
