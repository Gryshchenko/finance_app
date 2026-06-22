/**
 * Validation tests - Transaction routes
 *
 * POST   /user/:userId/transaction/
 * PATCH  /user/:userId/transaction/:transactionId
 * GET    /user/:userId/transaction/:transactionId
 * DELETE /user/:userId/transaction/:transactionId
 * GET    /user/:userId/transactions/ (query params)
 */

import { closeTestApp, createUser, deleteUserAfterTest, generateSecureRandom, getOverview } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode, TransactionType } from 'tenpercent/shared';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

let server: unknown;
const userIds: number[] = [];
let agent: ReturnType<typeof request.agent>;
let userId: number;
let authorization: string;
let accountId: number;
let incomeId: number;
let categoryId: number;
let targetAccountId: number;
let existingTransactionId: number;

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    server = app.listen(port);
    agent = request.agent(server);
    const db = DatabaseConnection.instance(config);
    const result = await createUser({ agent, databaseConnection: db });
    userId = result.userId;
    authorization = result.authorization;
    userIds.push(userId);

    const overview = await getOverview(agent, userId, authorization);
    accountId = overview.accounts[0].accountId;
    targetAccountId = overview.accounts[1]?.accountId ?? overview.accounts[0].accountId;
    incomeId = overview.incomes[0].incomeId;
    categoryId = overview.categories[0].categoryId;

    const res = await agent.post(`/user/${userId}/transaction/`).set('authorization', authorization).send({
        transactionTypeId: TransactionType.Income,
        accountId,
        incomeId,
        currencyCode: 'USD',
        targetCurrencyCode: 'USD',
        amount: 100,
        targetAmount: 100,
        description: 'Init',
    });
    existingTransactionId = res.body.data.transactionId;
});

afterAll(async () => {
    await closeTestApp(server, userIds);
});

// ─── POST /user/:userId/transaction/ - transaction type rules ─────────────────

describe('POST /user/:userId/transaction/ - transaction type validation', () => {
    const url = () => `/user/${userId}/transaction/`;

    // Income type
    it('400 - Income type without incomeId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                accountId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - Income type without accountId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - Income type with categoryId present (not allowed)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                accountId,
                incomeId,
                categoryId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    // Expense type
    it('400 - Expense type without categoryId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Expense,
                accountId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - Expense type without accountId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Expense,
                categoryId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - Expense type with incomeId present (not allowed)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Expense,
                accountId,
                categoryId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    // Transfer type
    it('400 - Transfer type without targetAccountId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Transafer,
                accountId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - Transfer type without accountId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Transafer,
                targetAccountId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - Transfer type with categoryId present (not allowed)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Transafer,
                accountId,
                targetAccountId,
                categoryId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - Transfer type with incomeId present (not allowed)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Transafer,
                accountId,
                targetAccountId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    // missing required fields
    it('400 - missing transactionTypeId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                accountId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - missing amount', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                accountId,
                incomeId,
                currencyCode: 'USD',
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - invalid transactionTypeId (does not exist)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: 999,
                accountId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    // field types
    it('400 - amount is a string', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                accountId,
                incomeId,
                currencyCode: 'USD',
                amount: 'abc',
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - transactionTypeId is a string', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: 'income',
                accountId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    // description
    it('400 - description too short (< 3 chars)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                accountId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
                description: 'ab',
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - description too long (> 200 chars)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                accountId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
                description: 'a'.repeat(201),
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    // createdAt
    it('400 - createdAt is not ISO8601', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                accountId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
                createdAt: 'not-a-date',
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - createdAt is a timestamp number', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                accountId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
                createdAt: 1700000000000,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    // unknown field
    it('400 - extra unknown field in body', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                accountId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
                hack: true,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    // query string
    it('400 - unexpected query param', async () => {
        await agent
            .post(`${url()}?foo=bar`)
            .set('authorization', authorization)
            .send({
                transactionTypeId: TransactionType.Income,
                accountId,
                incomeId,
                currencyCode: 'USD',
                amount: 100,
            })
            .expect(HttpCode.BAD_REQUEST);
    });

    // valid case
    it('201 - valid income transaction is created', async () => {
        const res = await agent.post(url()).set('authorization', authorization).send({
            transactionTypeId: TransactionType.Income,
            accountId,
            incomeId,
            currencyCode: 'USD',
            targetCurrencyCode: 'USD',
            amount: 50,
            targetAmount: 50,
            description: 'Valid test',
        });
        expect(res.status).toBe(HttpCode.CREATED);
        expect(res.body.data.transactionId).toEqual(expect.any(Number));
    });
});

// ─── PATCH /user/:userId/transaction/:transactionId ───────────────────────────

describe('PATCH /user/:userId/transaction/:transactionId - body & param validation', () => {
    const url = (id: number | string) => `/user/${userId}/transaction/${id}`;

    it('204 - empty body results in no-op update', async () => {
        await agent.patch(url(existingTransactionId)).set('authorization', authorization).send({}).expect(HttpCode.NO_CONTENT);
    });

    it('400 - description too short', async () => {
        await agent
            .patch(url(existingTransactionId))
            .set('authorization', authorization)
            .send({ description: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - description too long', async () => {
        await agent
            .patch(url(existingTransactionId))
            .set('authorization', authorization)
            .send({ description: 'a'.repeat(201) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - amount is a string', async () => {
        await agent
            .patch(url(existingTransactionId))
            .set('authorization', authorization)
            .send({ amount: 'bad' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - createdAt is not ISO8601', async () => {
        await agent
            .patch(url(existingTransactionId))
            .set('authorization', authorization)
            .send({ amount: 200, createdAt: 'not-a-date' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unknown field in body', async () => {
        await agent
            .patch(url(existingTransactionId))
            .set('authorization', authorization)
            .send({ amount: 200, hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    // path param
    it('400 - transactionId is a string', async () => {
        await agent.patch(url('abc')).set('authorization', authorization).send({ amount: 200 }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - transactionId is negative', async () => {
        await agent.patch(url(-1)).set('authorization', authorization).send({ amount: 200 }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unexpected query param', async () => {
        await agent
            .patch(`${url(existingTransactionId)}?foo=bar`)
            .set('authorization', authorization)
            .send({ amount: 200 })
            .expect(HttpCode.BAD_REQUEST);
    });
});

// ─── GET /user/:userId/transaction/:transactionId ─────────────────────────────

describe('GET /user/:userId/transaction/:transactionId - param validation', () => {
    const url = (id: number | string) => `/user/${userId}/transaction/${id}`;

    it('400 - transactionId is a string', async () => {
        await agent.get(url('abc')).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - transactionId is negative', async () => {
        await agent.get(url(-1)).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unexpected query param', async () => {
        await agent
            .get(`${url(existingTransactionId)}?foo=bar`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('404 - non-existent transactionId', async () => {
        await agent.get(url(999999999)).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
    });
});

// ─── GET /user/:userId/transactions/ - query param validation ─────────────────

describe('GET /user/:userId/transactions/ - query param validation', () => {
    const url = (q: string) => `/user/${userId}/transactions/?${q}`;

    it('400 - missing limit', async () => {
        await agent.get(url('')).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - limit is a string', async () => {
        await agent.get(url('limit=abc')).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unknown query param', async () => {
        await agent.get(url('limit=10&foo=bar')).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - accountId is a string', async () => {
        await agent.get(url('limit=10&accountId=abc')).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - malformed cursor', async () => {
        await agent.get(url('limit=10&cursor=!!!not-valid!!!')).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('200 - valid query without cursor returns first page', async () => {
        const res = await agent.get(url('limit=10')).set('authorization', authorization);
        expect(res.status).toBe(HttpCode.OK);
        expect(res.body.data).toBeDefined();
    });
});
