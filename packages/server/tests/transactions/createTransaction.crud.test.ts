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

        for (const query of [
            { name: 'accountId', id: accountId, not: ['categoryId', 'incomeId'] },
            { name: 'categoryId', id: categoryId, not: ['accountId', 'incomeId'] },
            { name: 'incomeId', id: incomeId, not: ['categoryId', 'incomeId'] },
        ]) {
            const all = await fetchTransactions(agent, userId, authorization, 100, 0, `&${query.name}=${query.id}`);
            for (let i = 0; i < 9; i += 3) {
                const cursoreId = all.data[i][query.name];
                for (const field of ['amount', 'createdAt']) {
                    for (const order of ['asc', 'desc']) {
                        const { resLimit, data } = await fetchTransactions(
                            agent,
                            userId,
                            authorization,
                            3,
                            cursoreId,
                            `&${query.name}=${query.id}&orderBy=${field}:${order}`,
                        );

                        for (const dt of data) {
                            const not = query.not;
                            for (const pr of not) {
                                expect(dt[pr]).toStrictEqual(undefined);
                            }
                        }

                        const sorted = [...data].sort((a, b) => {
                            const valA = a[field];
                            const valB = b[field];

                            if (order === 'asc') {
                                return valA > valB ? 1 : valA < valB ? -1 : 0;
                            } else {
                                return valA < valB ? 1 : valA > valB ? -1 : 0;
                            }
                        });

                        expect(data).toStrictEqual(sorted);
                        expect(resLimit).toStrictEqual(3);
                        expect(data.length).toStrictEqual(3);
                    }
                }
            }
        }

        const all = await fetchTransactionsAll(agent, userId, authorization, transactionIds.length, transactionIds[0]);
        expect(all.limit).toStrictEqual(transactionIds.length);
        expect(all.cursor).toStrictEqual(transactionIds[transactionIds.length - 1]);
        expect(all.data.length).toStrictEqual(transactionIds.length - 1);

        await fetchTransactionsBad(agent, userId, authorization);
    });
});
