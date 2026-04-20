import { createUser, deleteUserAfterTest, generateRandomNumber, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode, ICategory, IIncome, StatsPeriod, Time, Utils } from 'tenpercent/shared';
import {
    createExpenseTransactions,
    createIncomeTransactions,
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

describe('Stats', () => {
    it(`Check state for month`, async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });

        userIds.push(userId);
        const {
            body: {
                data: { accounts, categories, incomes },
            },
        } = await agent.get(`/user/${userId}/overview/`).set('authorization', authorization).send({}).expect(HttpCode.OK);

        const accountId = accounts[0].accountId;
        const targetAccountId = accounts[1].accountId;
        const currencyId = accounts[0].currencyId;

        const incomeIds = incomes.map((incomes: IIncome) => incomes.incomeId);
        const categoryIds = categories.map((category: ICategory) => category.categoryId);

        const dates: string[] = Array.from({ length: 30 }).map((_: unknown, index) => {
            const counter = index + 1;
            const str = counter <= 9 ? `0${counter}` : counter;
            return `2025-12-${str}T11:00:00`;
        });
        let sumBefore = 0;
        const from = '2025-12-01T00:00:00.000Z';
        const to = '2025-12-31T00:00:00.000Z';
        const incomesResultIds = [];
        const transferResultIds = [];
        const expanseResultIds = [];
        for (const date of dates) {
            const randomIndex = generateRandomNumber(0, categoryIds.length - 1);
            const randomId = categoryIds[randomIndex];
            sumBefore += 100;
            const ide = await createExpenseTransactions(
                agent,
                userId,
                authorization,
                accountId,
                randomId,
                currencyId,
                100,
                1,
                Time.getISODate(new Date(date)),
            );
            expanseResultIds.push(...ide);
            const randomIncomesIndex = generateRandomNumber(0, incomeIds.length - 1);
            const randomIncomesId = incomeIds[randomIncomesIndex];
            const idi = await createIncomeTransactions(
                agent,
                userId,
                authorization,
                accountId,
                randomIncomesId,
                currencyId,
                100,
                1,
                Time.getISODate(new Date(date)),
            );
            incomesResultIds.push(...idi);
            const idt = await createTransferTransactions(
                agent,
                userId,
                authorization,
                accountId,
                targetAccountId,
                currencyId,
                100,
                1,
                Time.getISODate(new Date(date)),
            );
            transferResultIds.push(...idt);
        }
        const data = await getCategoriesWithStats(agent, userId, authorization, {
            from: Time.getISODate(new Date(from)),
            to: Time.getISODate(new Date(to)),
            period: StatsPeriod.Month,
        });
        expect(data.to).toEqual(to);
        expect(data.from).toEqual(from);
        expect(data.total).toEqual(sumBefore);
        const summary = await getSummary(agent, userId, authorization, {
            from: '2025-12-01T00:00:00.000Z',
            to: '2025-12-31T00:00:00.000Z',
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(summary.expense_total)).toEqual(Utils.roundNumber(sumBefore));
        expect(Utils.roundNumber(summary.income_total)).toEqual(Utils.roundNumber(sumBefore));
        expect(Utils.roundNumber(summary.transfer_total)).toEqual(Utils.roundNumber(sumBefore));

        const categoriesWithStats = await getCategoriesWithStats(agent, userId, authorization, {
            from: '2025-12-01T00:00:00.000Z',
            to: '2025-12-31T00:00:00.000Z',
            period: StatsPeriod.Month,
        });

        expect(categoriesWithStats.total).toEqual(Utils.roundNumber(sumBefore));

        const incomesWithStates = await getIncomesWithStats(agent, userId, authorization, {
            from: '2025-12-01T00:00:00.000Z',
            to: '2025-12-31T00:00:00.000Z',
            period: StatsPeriod.Month,
        });

        expect(incomesWithStates.total).toEqual(Utils.roundNumber(sumBefore));

        await patchTransaction(agent, userId, authorization, incomesResultIds[0], {
            amount: 50,
        });
        await patchTransaction(agent, userId, authorization, transferResultIds[0], {
            amount: 50,
        });
        await patchTransaction(agent, userId, authorization, expanseResultIds[0], {
            amount: 50,
        });

        const categoriesWithStats1 = await getCategoriesWithStats(agent, userId, authorization, {
            from: '2025-12-01T00:00:00.000Z',
            to: '2025-12-31T00:00:00.000Z',
            period: StatsPeriod.Month,
        });

        expect(categoriesWithStats1.total).toEqual(Utils.roundNumber(sumBefore - 50));

        const incomesWithStates1 = await getIncomesWithStats(agent, userId, authorization, {
            from: '2025-12-01T00:00:00.000Z',
            to: '2025-12-31T00:00:00.000Z',
            period: StatsPeriod.Month,
        });

        expect(incomesWithStates1.total).toEqual(Utils.roundNumber(sumBefore - 50));

        const summary2 = await getSummary(agent, userId, authorization, {
            from: '2025-12-01T00:00:00.000Z',
            to: '2025-12-31T00:00:00.000Z',
            period: StatsPeriod.Month,
        });

        expect(Utils.roundNumber(summary2.expense_total)).toEqual(Utils.roundNumber(sumBefore - 50));
        expect(Utils.roundNumber(summary2.income_total)).toEqual(Utils.roundNumber(sumBefore - 50));
        expect(Utils.roundNumber(summary2.transfer_total)).toEqual(Utils.roundNumber(sumBefore - 50));

        await patchTransaction(agent, userId, authorization, incomesResultIds[0], {
            createdAt: Time.getISODate(new Date('2025-11-01T11:00:00')),
        });
        await patchTransaction(agent, userId, authorization, transferResultIds[0], {
            createdAt: Time.getISODate(new Date('2025-11-01T11:00:00')),
        });
        await patchTransaction(agent, userId, authorization, expanseResultIds[0], {
            createdAt: Time.getISODate(new Date('2025-11-01T11:00:00')),
        });

        const summary3 = await getSummary(agent, userId, authorization, {
            from: '2025-12-01T00:00:00.000Z',
            to: '2025-12-31T00:00:00.000Z',
            period: StatsPeriod.Month,
        });

        expect(Utils.roundNumber(summary3.expense_total)).toEqual(Utils.roundNumber(sumBefore - 100));
        expect(Utils.roundNumber(summary3.income_total)).toEqual(Utils.roundNumber(sumBefore - 100));
        expect(Utils.roundNumber(summary3.transfer_total)).toEqual(Utils.roundNumber(sumBefore - 100));

        const summary4 = await getSummary(agent, userId, authorization, {
            from: '2025-11-01T00:00:00.000Z',
            to: '2025-11-30T00:00:00.000Z',
            period: StatsPeriod.Month,
        });

        expect(Utils.roundNumber(summary4.expense_total)).toEqual(Utils.roundNumber(50));
        expect(Utils.roundNumber(summary4.income_total)).toEqual(Utils.roundNumber(50));
        expect(Utils.roundNumber(summary4.transfer_total)).toEqual(Utils.roundNumber(50));

        await deleteTransaction(agent, userId, authorization, { transactionId: incomesResultIds[0] });
        await deleteTransaction(agent, userId, authorization, { transactionId: transferResultIds[0] });
        await deleteTransaction(agent, userId, authorization, { transactionId: expanseResultIds[0] });

        const summary5 = await getSummary(agent, userId, authorization, {
            from: '2025-11-01T00:00:00.000Z',
            to: '2025-11-30T00:00:00.000Z',
            period: StatsPeriod.Month,
        });
        expect(Utils.roundNumber(summary5.expense_total)).toEqual(Utils.roundNumber(0));
        expect(Utils.roundNumber(summary5.income_total)).toEqual(Utils.roundNumber(0));
        expect(Utils.roundNumber(summary5.transfer_total)).toEqual(Utils.roundNumber(0));
    });
});
