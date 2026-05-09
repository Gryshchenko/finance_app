import { createUser, deleteUserAfterTest, generateSecureRandom, getOverview } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { ErrorCode } from 'tenpercent/shared';
import { ResponseStatusType } from 'tenpercent/shared';
import { HttpCode } from 'tenpercent/shared';
import { getAccount } from '../account/AccountTestUtils';
import { createTransferTransaction, patchTransaction, tryPatchTransaction } from './TransactionsTestUtils';

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

describe('POST /transaction/create - transfare', () => {
    [10, 20, 32, 42.23, 4342, 342425, 32424.34, 324234.54, 5345345.345345, 5345345346.4554].forEach((num) => {
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
                    data: { accounts },
                },
            } = overview;

            // const incomeId = incomes[0].incomeId;
            const accountId = accounts[0].accountId;
            const currencyId = accounts[0].currencyId;
            const targetAccountId = accounts[1].accountId;

            const {
                body: { data: accountBefor },
            } = await agent
                .get(`/user/${userId}/account/${accountId}`)
                .set('authorization', authorization)
                .send({})
                .expect(HttpCode.OK);

            const {
                body: { data: targetAccountBefor },
            } = await agent
                .get(`/user/${userId}/account/${targetAccountId}`)
                .set('authorization', authorization)
                .send({})
                .expect(HttpCode.OK);
            const response = await agent
                .post(`/user/${userId}/transaction/`)
                .set('authorization', authorization)
                .send({
                    accountId,
                    currencyId,
                    transactionTypeId: 3,
                    targetAccountId,
                    amount: num,
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
            const {
                body: { data: targetAccountAfter },
            } = await agent
                .get(`/user/${userId}/account/${targetAccountId}`)
                .set('authorization', authorization)
                .send({})
                .expect(HttpCode.OK);
            expect(Number((accountBefor.amount - num).toFixed(2))).toStrictEqual(accountAfter.amount);
            expect(Number((targetAccountBefor.amount + num).toFixed(2))).toStrictEqual(targetAccountAfter.amount);
            expect(response.body).toStrictEqual({
                data: {
                    transactionId: response.body.data.transactionId,
                },
                errors: [],
                status: 1,
            });
        });
    });
    it(`patch transaction - change accountId`, async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts } = await getOverview(agent, userId, authorization);
        const accountId = accounts[0].accountId;
        const accountIdPatch = accounts[2]?.accountId ?? accounts[1].accountId;
        const targetAccountId = accounts[1].accountId;
        const currencyId = accounts[0].currencyId;

        const accountBefore = await getAccount(agent, userId, authorization, accountId);
        const accountPatchBefore = await getAccount(agent, userId, authorization, accountIdPatch);
        const targetBefore = await getAccount(agent, userId, authorization, targetAccountId);

        const id = await createTransferTransaction(agent, userId, authorization, accountId, targetAccountId, currencyId, 100);

        await patchTransaction(agent, userId, authorization, id, { accountId: accountIdPatch });

        const accountAfter = await getAccount(agent, userId, authorization, accountId);
        const accountPatchAfter = await getAccount(agent, userId, authorization, accountIdPatch);
        const targetAfter = await getAccount(agent, userId, authorization, targetAccountId);

        // source restored
        expect(accountAfter.amount).toStrictEqual(Number(accountBefore.amount.toFixed(2)));
        // new source debited
        expect(accountPatchAfter.amount).toStrictEqual(Number((accountPatchBefore.amount - 100).toFixed(2)));
        // target stays credited
        expect(targetAfter.amount).toStrictEqual(Number((targetBefore.amount + 100).toFixed(2)));
    });

    it(`patch transaction - change targetAccountId`, async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts } = await getOverview(agent, userId, authorization);
        const accountId = accounts[0].accountId;
        const targetAccountId = accounts[1].accountId;
        const targetAccountIdPatch = accounts[2]?.accountId ?? accounts[1].accountId;
        const currencyId = accounts[0].currencyId;

        const accountBefore = await getAccount(agent, userId, authorization, accountId);
        const targetBefore = await getAccount(agent, userId, authorization, targetAccountId);
        const targetPatchBefore = await getAccount(agent, userId, authorization, targetAccountIdPatch);

        const id = await createTransferTransaction(agent, userId, authorization, accountId, targetAccountId, currencyId, 100);

        await patchTransaction(agent, userId, authorization, id, { targetAccountId: targetAccountIdPatch });

        const accountAfter = await getAccount(agent, userId, authorization, accountId);
        const targetAfter = await getAccount(agent, userId, authorization, targetAccountId);
        const targetPatchAfter = await getAccount(agent, userId, authorization, targetAccountIdPatch);

        // source stays debited
        expect(accountAfter.amount).toStrictEqual(Number((accountBefore.amount - 100).toFixed(2)));
        // old target restored
        expect(targetAfter.amount).toStrictEqual(Number(targetBefore.amount.toFixed(2)));
        // new target credited
        expect(targetPatchAfter.amount).toStrictEqual(Number((targetPatchBefore.amount + 100).toFixed(2)));
    });

    it('patch transaction - change amount', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts } = await getOverview(agent, userId, authorization);
        const accountId = accounts[0].accountId;
        const targetAccountId = accounts[1].accountId;
        const currencyId = accounts[0].currencyId;

        const accountBefore = await getAccount(agent, userId, authorization, accountId);
        const targetBefore = await getAccount(agent, userId, authorization, targetAccountId);

        const id = await createTransferTransaction(agent, userId, authorization, accountId, targetAccountId, currencyId, 100);

        await patchTransaction(agent, userId, authorization, id, { amount: 200 });

        const accountAfter = await getAccount(agent, userId, authorization, accountId);
        const targetAfter = await getAccount(agent, userId, authorization, targetAccountId);

        expect(accountAfter.amount).toStrictEqual(Number((accountBefore.amount - 200).toFixed(2)));
        expect(targetAfter.amount).toStrictEqual(Number((targetBefore.amount + 200).toFixed(2)));
    });

    it('patch transaction - change amount and accountId simultaneously', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts } = await getOverview(agent, userId, authorization);
        const accountId = accounts[0].accountId;
        const accountIdPatch = accounts[2]?.accountId ?? accounts[1].accountId;
        const targetAccountId = accounts[1].accountId;
        const currencyId = accounts[0].currencyId;

        const accountBefore = await getAccount(agent, userId, authorization, accountId);
        const accountPatchBefore = await getAccount(agent, userId, authorization, accountIdPatch);
        const targetBefore = await getAccount(agent, userId, authorization, targetAccountId);

        const id = await createTransferTransaction(agent, userId, authorization, accountId, targetAccountId, currencyId, 100);

        await patchTransaction(agent, userId, authorization, id, { accountId: accountIdPatch, amount: 200 });

        const accountAfter = await getAccount(agent, userId, authorization, accountId);
        const accountPatchAfter = await getAccount(agent, userId, authorization, accountIdPatch);
        const targetAfter = await getAccount(agent, userId, authorization, targetAccountId);

        expect(accountAfter.amount).toStrictEqual(Number(accountBefore.amount.toFixed(2)));
        expect(accountPatchAfter.amount).toStrictEqual(Number((accountPatchBefore.amount - 200).toFixed(2)));
        expect(targetAfter.amount).toStrictEqual(Number((targetBefore.amount + 200).toFixed(2)));
    });

    it('patch transaction - change metadata only (description) does not affect balance', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts } = await getOverview(agent, userId, authorization);
        const accountId = accounts[0].accountId;
        const targetAccountId = accounts[1].accountId;
        const currencyId = accounts[0].currencyId;

        const id = await createTransferTransaction(agent, userId, authorization, accountId, targetAccountId, currencyId, 100);
        const accountAfterCreate = await getAccount(agent, userId, authorization, accountId);
        const targetAfterCreate = await getAccount(agent, userId, authorization, targetAccountId);

        await patchTransaction(agent, userId, authorization, id, { description: 'Updated description' });

        const accountAfterPatch = await getAccount(agent, userId, authorization, accountId);
        const targetAfterPatch = await getAccount(agent, userId, authorization, targetAccountId);

        expect(accountAfterPatch.amount).toStrictEqual(accountAfterCreate.amount);
        expect(targetAfterPatch.amount).toStrictEqual(targetAfterCreate.amount);
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

        const { accounts: accounts1 } = await getOverview(agent, userId1, auth1);

        const id = await createTransferTransaction(
            agent,
            userId1,
            auth1,
            accounts1[0].accountId,
            accounts1[1].accountId,
            accounts1[0].currencyId,
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

        const { accounts } = await getOverview(agent, userId, authorization);

        const id = await createTransferTransaction(
            agent,
            userId,
            authorization,
            accounts[0].accountId,
            accounts[1].accountId,
            accounts[0].currencyId,
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

    it('should not create new transaction - miss targetAccountId', async () => {
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
                transactionTypeId: 3,
                amount: 1000,
                description: 'Test',
            })
            .expect(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                    msg: expect.any(String),
                    payload: expect.any(Object),
                },
            ],
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
                transactionTypeId: 3,
                amount: 1000,
                description: 'Test',
            })
            .expect(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.TRANSACTION_ERROR,

                    msg: expect.any(String),
                    payload: expect.any(Object),
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should not create new transaction - miss targetAccountId and accountId', async () => {
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
                transactionTypeId: 3,
                amount: 1000,
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
                targetAccountId: 5,
                transactionTypeId: 3,
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
                targetAccountId: 5,
                currencyId: 1,
                transactionTypeId: 3,
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
