import { createUser, deleteUserAfterTest, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode } from 'tenpercent/shared';

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
    server.close(done);
});

describe('Access control', () => {
    it("denies access to another user's account, category, balance and transaction", async () => {
        const agent = request.agent(server);
        const databaseConnection = new DatabaseConnection(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });
        const userAId = userId;
        const authA = authorization;
        userIds.push(userAId);

        const accountRes = await agent
            .post(`/user/${userAId}/account/`)
            .set('authorization', authA)
            .send({
                accountName: 'Main',
                amount: 1000,
                currencyId: 1,
                iconId: 'test_icon',
            })
            .expect(HttpCode.OK);

        const accountId = accountRes.body.data.accountId;

        const categoryRes = await agent
            .post(`/user/${userAId}/category/`)
            .set('authorization', authA)
            .send({
                categoryName: 'Groceries',
                currencyId: 1,
                iconId: 'test_icon',
            })
            .expect(HttpCode.OK);

        const categoryId = categoryRes.body.data.categoryId;

        const transactionRes = await agent
            .post(`/user/${userAId}/transaction/`)
            .set('authorization', authA)
            .send({
                accountId,
                currencyId: 1,
                transactionTypeId: 2,
                categoryId,
                amount: 100,
                description: 'Hidden from others',
            })
            .expect(HttpCode.CREATED);

        const transactionId = transactionRes.body.data.transactionId;

        const { userId: userBId, authorization: authB } = await createUser({
            agent,
            databaseConnection,
        });
        userIds.push(userBId);

        await agent.get(`/user/${userBId}/accounts/${accountId}`).set('authorization', authB).expect(HttpCode.NOT_FOUND);

        await agent.get(`/user/${userBId}/categories/${categoryId}`).set('authorization', authB).expect(HttpCode.NOT_FOUND);

        await agent.get(`/user/${userAId}/balance`).set('authorization', authB).expect(HttpCode.FORBIDDEN);

        await agent
            .delete(`/user/${userBId}/transaction/${transactionId}`)
            .set('authorization', authB)
            .expect(HttpCode.NOT_FOUND);
    });
});
