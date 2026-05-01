import { createUser, deleteUserAfterTest, generateSecureRandom, getOverview } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode, Time } from 'tenpercent/shared';
import { createAllTransactions, fetchTransactions, fetchTransactionsAll, fetchTransactionsBad } from './TransactionsTestUtils';

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

describe('PATCH /transaction/patch - amount', () => {
    it(`should create new transaction amount, createdAt, description`, async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });

        userIds.push(userId);
        const {
            body: {
                data: { accounts },
            },
        } = await agent.get(`/user/${userId}/overview/`).set('authorization', authorization).send({}).expect(HttpCode.OK);

        const accountId = accounts[0].accountId;
        const currencyId = accounts[0].currencyId;
        const targetAccountId = accounts[1].accountId;

        const response = await agent
            .post(`/user/${userId}/transaction/`)
            .set('authorization', authorization)
            .send({
                accountId,
                currencyId,
                transactionTypeId: 3,
                targetAccountId,
                amount: 1000,
                description: 'Test',
                createdAt: Time.getISODateNowUTC(),
            })
            .expect(HttpCode.CREATED);
        const transaction = await agent
            .get(`/user/${userId}/transaction/${response.body.data.transactionId}`)
            .set('authorization', authorization)
            .expect(HttpCode.OK);

        const newDate = Time.getISODateNowUTC();
        expect(transaction.body.data.amount).toStrictEqual('1000');
        expect(transaction.body.data.description).toStrictEqual('Test');
        expect(transaction.body.data.targetAccountId).toStrictEqual(targetAccountId);
        expect(transaction.body.data.accountId).toStrictEqual(accountId);

        await agent
            .patch(`/user/${userId}/transaction/${response.body.data.transactionId}`)
            .set('authorization', authorization)
            .send({
                amount: 1500,
                description: 'Test 1',
                createdAt: newDate,
                targetAccountId: accountId,
                accountId: targetAccountId,
            })
            .expect(HttpCode.NO_CONTENT);
        const transactionPatch = await agent
            .get(`/user/${userId}/transaction/${response.body.data.transactionId}`)
            .set('authorization', authorization)
            .expect(HttpCode.OK);

        expect(transactionPatch.body.data.amount).toStrictEqual('1500');
        expect(transactionPatch.body.data.description).toStrictEqual('Test 1');
        expect(transactionPatch.body.data.targetAccountId).toStrictEqual(accountId);
        expect(transactionPatch.body.data.accountId).toStrictEqual(targetAccountId);

        await agent
            .patch(`/user/${userId}/transaction/${response.body.data.transactionId}`)
            .set('authorization', authorization)
            .send({
                testq: 'something wrong',
            })
            .expect(HttpCode.BAD_REQUEST);

        await agent.get(`/user/${userId}/transaction/-100`).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);

        await agent
            .delete(`/user/${userId}/transaction/${response.body.data.transactionId}`)
            .set('authorization', authorization)
            .expect(HttpCode.NO_CONTENT);
        await agent
            .get(`/user/${userId}/transaction/${response.body.data.transactionId}`)
            .set('authorization', authorization)
            .expect(HttpCode.NOT_FOUND);
    });
    it(`pagination`, async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, incomes, categories } = await getOverview(agent, userId, authorization);

        const accountId = accounts[0].accountId;
        const currencyId = accounts[0].currencyId;
        const categoryId = categories[0].categoryId;
        const incomeId = incomes[0].incomeId;
        const targetAccountId = accounts[1].accountId;

        const transactionIds = await createAllTransactions(
            agent,
            userId,
            authorization,
            accountId,
            currencyId,
            categoryId,
            incomeId,
            targetAccountId,
        );

        expect(transactionIds.length).toStrictEqual(3 * 9);

        // Verify filter isolation — no cross-contamination between entity types
        for (const query of [
            { name: 'accountId', id: accountId, not: ['categoryId', 'incomeId'] },
            { name: 'categoryId', id: categoryId, not: ['accountId', 'incomeId'] },
            { name: 'incomeId', id: incomeId, not: ['categoryId', 'incomeId'] },
        ]) {
            const { data } = await fetchTransactions(agent, userId, authorization, 100, undefined, `&${query.name}=${query.id}`);
            for (const dt of data) {
                for (const pr of query.not) {
                    expect(dt[pr]).toBeUndefined();
                }
            }
        }

        // Verify cursor pagination — no overlap between pages
        const page1 = await fetchTransactionsAll(agent, userId, authorization, 10);
        expect(page1.data.length).toStrictEqual(10);
        expect(typeof page1.cursor).toStrictEqual('string');

        const page2 = await fetchTransactionsAll(agent, userId, authorization, 10, page1.cursor);
        const page1Ids = new Set(page1.data.map((t: { transactionId: number }) => t.transactionId));
        for (const t of page2.data) {
            expect(page1Ids.has(t.transactionId)).toBe(false);
        }

        // Verify results are sorted by createdAt DESC
        for (let i = 0; i < page1.data.length - 1; i++) {
            const a = new Date(page1.data[i].createdAt).getTime();
            const b = new Date(page1.data[i + 1].createdAt).getTime();
            expect(a).toBeGreaterThanOrEqual(b);
        }

        await fetchTransactionsBad(agent, userId, authorization);
    });
});
