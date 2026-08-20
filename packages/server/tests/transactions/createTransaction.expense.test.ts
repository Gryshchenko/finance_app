import { createUser, deleteUserAfterTest, generateSecureRandom, getOverview } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { KeyValueStoreBuilder } from 'src/repositories/keyValueStore/KeyValueStoreBuilder';
import { ErrorCode, TransactionType } from '@tenpercent/shared';
import { ResponseStatusType } from '@tenpercent/shared';
import { HttpCode } from '@tenpercent/shared';
import { createExpenseTransaction, patchTransaction, tryCreateTransaction, tryPatchTransaction } from './TransactionsTestUtils';
import { createAccount, getAccount } from '../account/AccountTestUtils';

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

describe('POST /transaction/create - expense', () => {
    [10, 20, 32, 42.23, 4342, 342425, 32424.34, 324234.54, 5345345.345345, 5345345346.4554].forEach((num) => {
        it(`should create new transaction num: ${num}`, async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);
            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            const { accounts, categories } = await getOverview(agent, userId, authorization);
            const accountId = accounts[0].accountId;
            const currencyCode = accounts[0].currencyCode;
            const categoryId = categories[0].categoryId;

            const accountBefore = await getAccount(agent, userId, authorization, accountId);

            const response = await tryCreateTransaction(agent, userId, authorization, {
                accountId,
                currencyCode,
                targetCurrencyCode: currencyCode,
                transactionTypeId: TransactionType.Expense,
                amount: num,
                targetAmount: num,
                description: 'Test',
                categoryId,
            });
            expect(response.status).toBe(HttpCode.CREATED);

            const accountAfter = await getAccount(agent, userId, authorization, accountId);

            expect(Number((accountBefore.amount - num).toFixed(2))).toStrictEqual(accountAfter.amount);
            expect(response.body).toStrictEqual({
                data: { transactionId: response.body.data.transactionId },
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

        const { accounts, categories } = await getOverview(agent, userId, authorization);
        const accountId = accounts[0].accountId;
        const currencyCode = accounts[0].currencyCode;
        const categoryId = categories[0].categoryId;
        // Registration seeds a single account, so the account to move the transaction to is ours to create.
        const accountIdPatch = await createAccount(agent, userId, authorization, currencyCode, 1000, 'Patch target');

        const accountBefore = await getAccount(agent, userId, authorization, accountId);
        const accountPatchBefore = await getAccount(agent, userId, authorization, accountIdPatch);

        const id = await createExpenseTransaction(agent, userId, authorization, accountId, categoryId, currencyCode, 100);

        const accountAfterCreate = await getAccount(agent, userId, authorization, accountId);
        expect(accountAfterCreate.amount).toStrictEqual(Number((accountBefore.amount - 100).toFixed(2)));

        await patchTransaction(agent, userId, authorization, id, { accountId: accountIdPatch });

        const accountAfter = await getAccount(agent, userId, authorization, accountId);
        const accountPatch = await getAccount(agent, userId, authorization, accountIdPatch);

        expect(accountAfter.amount).toStrictEqual(Number(accountBefore.amount.toFixed(2)));
        expect(accountPatch.amount).toStrictEqual(Number((accountPatchBefore.amount - 100).toFixed(2)));
    });

    it('patch transaction - change amount', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, categories } = await getOverview(agent, userId, authorization);
        const accountId = accounts[0].accountId;
        const currencyCode = accounts[0].currencyCode;
        const categoryId = categories[0].categoryId;

        const accountBefore = await getAccount(agent, userId, authorization, accountId);
        const id = await createExpenseTransaction(agent, userId, authorization, accountId, categoryId, currencyCode, 100);

        await patchTransaction(agent, userId, authorization, id, { amount: 200 });

        const accountAfter = await getAccount(agent, userId, authorization, accountId);
        // original -100, then delta (200-100=100 extra deducted) → accountBefore - 200
        expect(accountAfter.amount).toStrictEqual(Number((accountBefore.amount - 200).toFixed(2)));
    });

    it('patch transaction - change amount and accountId simultaneously', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, categories } = await getOverview(agent, userId, authorization);
        const accountId = accounts[0].accountId;
        const currencyCode = accounts[0].currencyCode;
        const categoryId = categories[0].categoryId;
        // Registration seeds a single account, so the account to move the transaction to is ours to create.
        const accountIdPatch = await createAccount(agent, userId, authorization, currencyCode, 1000, 'Patch target');

        const accountBefore = await getAccount(agent, userId, authorization, accountId);
        const accountPatchBefore = await getAccount(agent, userId, authorization, accountIdPatch);

        const id = await createExpenseTransaction(agent, userId, authorization, accountId, categoryId, currencyCode, 100);

        await patchTransaction(agent, userId, authorization, id, { accountId: accountIdPatch, amount: 200 });

        const accountAfter = await getAccount(agent, userId, authorization, accountId);
        const accountPatch = await getAccount(agent, userId, authorization, accountIdPatch);

        expect(accountAfter.amount).toStrictEqual(Number(accountBefore.amount.toFixed(2)));
        expect(accountPatch.amount).toStrictEqual(Number((accountPatchBefore.amount - 200).toFixed(2)));
    });

    it('patch transaction - change metadata only (description/categoryId) does not affect balance', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, categories } = await getOverview(agent, userId, authorization);
        const accountId = accounts[0].accountId;
        const currencyCode = accounts[0].currencyCode;
        const categoryId = categories[0].categoryId;
        const secondCategoryId = categories[1]?.categoryId ?? categoryId;

        const id = await createExpenseTransaction(agent, userId, authorization, accountId, categoryId, currencyCode, 100);
        const accountAfterCreate = await getAccount(agent, userId, authorization, accountId);

        await patchTransaction(agent, userId, authorization, id, {
            description: 'Updated description',
            categoryId: secondCategoryId,
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

        const { accounts: accounts1, categories: categories1 } = await getOverview(agent, userId1, auth1);

        const id = await createExpenseTransaction(
            agent,
            userId1,
            auth1,
            accounts1[0].accountId,
            categories1[0].categoryId,
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

        const { accounts, categories } = await getOverview(agent, userId, authorization);

        const id = await createExpenseTransaction(
            agent,
            userId,
            authorization,
            accounts[0].accountId,
            categories[0].categoryId,
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

    it('should not create new transaction - miss categoryId', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts } = await getOverview(agent, userId, authorization);

        const response = await tryCreateTransaction(agent, userId, authorization, {
            accountId: accounts[0].accountId,
            currencyCode: accounts[0].currencyCode,
            targetCurrencyCode: accounts[0].currencyCode,
            transactionTypeId: TransactionType.Expense,
            amount: 1000,
            targetAmount: 1000,
            description: 'Test',
        });
        expect(response.status).toBe(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.TRANSACTION_ERROR, msg: expect.any(String), payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });

    it('should not create new transaction - miss accountId', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { categories } = await getOverview(agent, userId, authorization);

        const response = await tryCreateTransaction(agent, userId, authorization, {
            categoryId: categories[0].categoryId,
            currencyCode: 'USD',
            targetCurrencyCode: 'USD',
            transactionTypeId: TransactionType.Expense,
            amount: 1000,
            targetAmount: 1000,
            description: 'Test',
        });
        expect(response.status).toBe(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.TRANSACTION_ERROR, msg: expect.any(String), payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });

    it('should not create new transaction - miss categoryId and accountId', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const response = await tryCreateTransaction(agent, userId, authorization, {
            currencyCode: 'USD',
            targetCurrencyCode: 'USD',
            transactionTypeId: TransactionType.Expense,
            amount: 1000,
            targetAmount: 1000,
            description: 'Test',
        });
        expect(response.status).toBe(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.TRANSACTION_ERROR, msg: expect.any(String), payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });

    it('should not create new transaction - miss amount', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const { accounts, categories } = await getOverview(agent, userId, authorization);

        const response = await tryCreateTransaction(agent, userId, authorization, {
            accountId: accounts[0].accountId,
            categoryId: categories[0].categoryId,
            currencyCode: accounts[0].currencyCode,
            targetCurrencyCode: accounts[0].currencyCode,
            transactionTypeId: TransactionType.Expense,
            targetAmount: 1000,
            description: 'Test',
        });
        expect(response.status).toBe(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.TRANSACTION_ERROR, msg: expect.any(String), payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });

    it('should not create new transaction - not allow unknown properties', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });

        const { accounts, categories } = await getOverview(agent, userId, authorization);

        const response = await tryCreateTransaction(agent, userId, authorization, {
            accountId: accounts[0].accountId,
            categoryId: categories[0].categoryId,
            currencyCode: accounts[0].currencyCode,
            transactionTypeId: TransactionType.Expense,
            amount: 1000,
            description: 'Test',
            test: 'unknown',
        });
        expect(response.status).toBe(HttpCode.BAD_REQUEST);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.UNEXPECTED_PROPERTY, payload: expect.any(Object) }],
            status: ResponseStatusType.INTERNAL,
        });
    });
});
