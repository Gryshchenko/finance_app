import { createUser, deleteUserAfterTest, generateSecureRandom, getOverview } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { KeyValueStoreBuilder } from '../../src/repositories/keyValueStore/KeyValueStoreBuilder';
import { ErrorCode, TransactionType } from 'tenpercent/shared';
import { ResponseStatusType } from 'tenpercent/shared';
import { HttpCode } from 'tenpercent/shared';
import { getAccount } from '../account/AccountTestUtils';
import { createIncomeTransaction, getTransaction, patchTransaction, tryPatchTransaction } from './TransactionsTestUtils';

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

afterAll(async () => {
    const databaseConnection = DatabaseConnection.instance(config);
    for (const id of userIds) {
        await deleteUserAfterTest(id, databaseConnection);
    }
    userIds = [];

    await new Promise<void>((resolve) => {
        // @ts-expect-error server is assigned in beforeAll
        server.close(() => resolve());
        // @ts-expect-error drop idle keep-alive sockets so close() can complete
        server.closeAllConnections?.();
    });

    try {
        await KeyValueStoreBuilder.build().disconnect();
    } catch {
        // redis client may already be closed
    }
    await databaseConnection.close();
});

describe('POST /transaction/create - income', () => {
    for (const num of [10, 20, 32, 42.23, 4342, 342425, 32424.34, 324234.54, 5345345.345345, 5345345346.4554]) {
        it(`should create new transaction num: ${num}`, async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);
            const { userId, authorization } = await createUser({
                agent,
                databaseConnection,
            });
            userIds.push(userId);
            const overview = await agent
                .get(`/user/${userId}/overview/`)
                .set('authorization', authorization)
                .send({})
                .expect(HttpCode.OK);
            const {
                body: {
                    data: { accounts, incomes },
                },
            } = overview;

            const incomeId = incomes[0].incomeId;
            const accountId = accounts[0].accountId;
            const currencyCode = accounts[0].currencyCode;

            const {
                body: { data: accountBefor },
            } = await agent
                .get(`/user/${userId}/account/${accountId}`)
                .set('authorization', authorization)
                .send({})
                .expect(HttpCode.OK);

            const response = await agent
                .post(`/user/${userId}/transaction/`)
                .set('authorization', authorization)
                .send({
                    incomeId,
                    accountId,
                    currencyCode,
                    transactionTypeId: TransactionType.Income,
                    amount: num,
                    targetAmount: num,
                    targetCurrencyCode: currencyCode,
                    description: 'Test',
                })
                .expect(HttpCode.CREATED);
            const {
                body: { data: accountAfter },
            } = await agent
                .get(`/user/${userId}/account/${accountId}`)
                .set('authorization', authorization)
                .send({})
                .expect(HttpCode.OK);
            expect(Number((accountBefor.amount + num).toFixed(2))).toStrictEqual(accountAfter.amount);
            expect(response.body).toStrictEqual({
                data: {
                    transactionId: response.body.data.transactionId,
                },
                errors: [],
                status: 1,
            });
            const {
                body: {
                    data: { balance },
                },
            } = await agent.get(`/user/${userId}/balance`).set('authorization', authorization).send({}).expect(HttpCode.OK);
            expect(balance).toStrictEqual(num);
        });
    }

    it(`patch transaction - change accountId`, async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, incomes } = await getOverview(agent, userId, authorization);
        const incomeId = incomes[0].incomeId;
        const accountId = accounts[0].accountId;
        const accountIdPatch = accounts[1].accountId;
        const currencyCode = accounts[0].currencyCode;

        const accountBefore = await getAccount(agent, userId, authorization, accountId);

        expect(accountBefore.amount).toStrictEqual(Number((0).toFixed(2)));

        const id = await createIncomeTransaction(agent, userId, authorization, accountId, incomeId, currencyCode, 100);

        const accountAfterCreate = await getAccount(agent, userId, authorization, accountId);
        expect(accountAfterCreate.amount).toStrictEqual(Number((100).toFixed(2)));

        await patchTransaction(agent, userId, authorization, id, { accountId: accountIdPatch });

        const accountAfter = await getAccount(agent, userId, authorization, accountId);
        const accountPatch = await getAccount(agent, userId, authorization, accountIdPatch);

        expect(accountAfter.amount).toStrictEqual(Number((0).toFixed(2)));
        expect(accountPatch.amount).toStrictEqual(Number((100).toFixed(2)));
    });

    it(`patch transaction - change incomeId`, async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, incomes } = await getOverview(agent, userId, authorization);
        const incomeId = incomes[0].incomeId;
        const incomeIdPatch = incomes[0].incomeId;
        const accountId = accounts[0].accountId;
        const currencyCode = accounts[0].currencyCode;

        const accountBefore = await getAccount(agent, userId, authorization, accountId);

        expect(accountBefore.amount).toStrictEqual(Number((0).toFixed(2)));

        const id = await createIncomeTransaction(agent, userId, authorization, accountId, incomeId, currencyCode, 100);

        const accountAfterCreate = await getAccount(agent, userId, authorization, accountId);

        expect(accountAfterCreate.amount).toStrictEqual(Number((100).toFixed(2)));

        await patchTransaction(agent, userId, authorization, id, { incomeId: incomeIdPatch });

        const transactionAfterPatch = await getTransaction(agent, userId, authorization, { transactionId: id });

        expect(transactionAfterPatch.incomeId).toStrictEqual(incomeIdPatch);

        const accountAfter = await getAccount(agent, userId, authorization, accountId);

        expect(accountAfter.amount).toStrictEqual(Number((100).toFixed(2)));
    });

    it('patch transaction - change amount', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, incomes } = await getOverview(agent, userId, authorization);
        const incomeId = incomes[0].incomeId;
        const accountId = accounts[0].accountId;
        const currencyCode = accounts[0].currencyCode;

        const accountBefore = await getAccount(agent, userId, authorization, accountId);

        expect(accountBefore.amount).toStrictEqual(Number((0).toFixed(2)));

        const id = await createIncomeTransaction(agent, userId, authorization, accountId, incomeId, currencyCode, 100);

        const accountPath = await getAccount(agent, userId, authorization, accountId);

        expect(accountPath.amount).toStrictEqual(Number((100).toFixed(2)));

        await patchTransaction(agent, userId, authorization, id, { amount: 200 });

        const accountAfter = await getAccount(agent, userId, authorization, accountId);

        expect(accountAfter.amount).toStrictEqual(Number((200).toFixed(2)));
    });

    it('patch transaction - change amount and accountId simultaneously', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, incomes } = await getOverview(agent, userId, authorization);
        const incomeId = incomes[0].incomeId;
        const accountId = accounts[0].accountId;
        const accountIdPatch = accounts[1].accountId;
        const currencyCode = accounts[0].currencyCode;

        const accountBefore = await getAccount(agent, userId, authorization, accountId);
        const accountPatchBefore = await getAccount(agent, userId, authorization, accountIdPatch);

        const id = await createIncomeTransaction(agent, userId, authorization, accountId, incomeId, currencyCode, 100);

        await patchTransaction(agent, userId, authorization, id, { accountId: accountIdPatch, amount: 200 });

        const accountAfter = await getAccount(agent, userId, authorization, accountId);
        const accountPatch = await getAccount(agent, userId, authorization, accountIdPatch);

        expect(accountAfter.amount).toStrictEqual(Number(accountBefore.amount.toFixed(2)));
        expect(accountPatch.amount).toStrictEqual(Number((accountPatchBefore.amount + 200).toFixed(2)));
    });

    it('patch transaction - change metadata only (description) does not affect balance', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, incomes } = await getOverview(agent, userId, authorization);
        const incomeId = incomes[0].incomeId;
        const accountId = accounts[0].accountId;
        const currencyCode = accounts[0].currencyCode;

        const id = await createIncomeTransaction(agent, userId, authorization, accountId, incomeId, currencyCode, 100);
        const accountAfterCreate = await getAccount(agent, userId, authorization, accountId);

        await patchTransaction(agent, userId, authorization, id, {
            description: 'Updated description',
        });

        const accountAfterPatch = await getAccount(agent, userId, authorization, accountId);
        expect(accountAfterPatch.amount).toStrictEqual(accountAfterCreate.amount);
    });

    it('patch transaction - non-existent transactionId returns error', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const response = await tryPatchTransaction(agent, userId, authorization, 999999999, { amount: 200 });
        expect(response.status).toBe(HttpCode.NOT_FOUND);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.TRANSACTION_ERROR }],
            status: ResponseStatusType.INTERNAL,
        });
    });

    it('patch transaction - cannot patch transaction of another user', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId: userId1, authorization: auth1 } = await createUser({ agent, databaseConnection });
        const { userId: userId2, authorization: auth2 } = await createUser({ agent, databaseConnection });
        userIds.push(userId1, userId2);

        const { accounts: accounts1, incomes: incomes1 } = await getOverview(agent, userId1, auth1);

        const id = await createIncomeTransaction(
            agent,
            userId1,
            auth1,
            accounts1[0].accountId,
            incomes1[0].incomeId,
            accounts1[0].currencyCode,
            100,
        );

        const crossUserResponse = await tryPatchTransaction(agent, userId2, auth2, id, { amount: 9999 });
        expect(crossUserResponse.status).toBe(HttpCode.NOT_FOUND);
    });

    it('patch transaction - unknown properties returns UNEXPECTED_PROPERTY', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, incomes } = await getOverview(agent, userId, authorization);

        const id = await createIncomeTransaction(
            agent,
            userId,
            authorization,
            accounts[0].accountId,
            incomes[0].incomeId,
            accounts[0].currencyCode,
            100,
        );

        const response = await tryPatchTransaction(agent, userId, authorization, id, { amount: 200, unknownField: 'hack' });
        expect(response.status).toBe(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.UNEXPECTED_PROPERTY, payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });

    it('should not create new transaction - miss incomeId', async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });
        userIds.push(userId);
        const response = await agent
            .post(`/user/${userId}/transaction/`)
            .set('authorization', authorization)
            .send({
                accountId: 21,
                currencyCode: 'USD',
                targetCurrencyCode: 'USD',
                transactionTypeId: 1,
                amount: 1000,
                targetAmount: 1000,
                description: 'Test',
            })
            .expect(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.TRANSACTION_ERROR, msg: expect.any(String), payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should not create new transaction - miss accountId', async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });
        userIds.push(userId);
        const response = await agent
            .post(`/user/${userId}/transaction/`)
            .set('authorization', authorization)
            .send({
                incomeId: 21,
                currencyCode: 'USD',
                targetCurrencyCode: 'USD',
                transactionTypeId: 1,
                amount: 1000,
                targetAmount: 1000,
                description: 'Test',
            })
            .expect(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.TRANSACTION_ERROR, msg: expect.any(String), payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should not create new transaction - miss incomeId and accountId', async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });
        userIds.push(userId);
        const response = await agent
            .post(`/user/${userId}/transaction/`)
            .set('authorization', authorization)
            .send({
                currencyCode: 'USD',
                targetCurrencyCode: 'USD',
                transactionTypeId: 1,
                amount: 1000,
                targetAmount: 1000,
                description: 'Test',
            })
            .expect(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.TRANSACTION_ERROR, msg: expect.any(String), payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should not create new transaction - miss amount', async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });
        userIds.push(userId);
        const response = await agent
            .post(`/user/${userId}/transaction/`)
            .set('authorization', authorization)
            .send({
                accountId: 5,
                incomeId: 5,
                currencyCode: 'USD',
                targetCurrencyCode: 'USD',
                transactionTypeId: 1,
                targetAmount: 1000,
                description: 'Test',
            })
            .expect(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.TRANSACTION_ERROR, msg: expect.any(String), payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should not create new transaction - not allow unknown properties', async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });
        const response = await agent
            .post(`/user/${userId}/transaction/`)
            .set('authorization', authorization)
            .send({
                accountId: 5,
                incomeId: 5,
                currencyCode: 'USD',
                transactionTypeId: 1,
                amount: 1000,
                description: 'Test',
                test: 'unknown',
            })
            .expect(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.UNEXPECTED_PROPERTY, payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });
});
