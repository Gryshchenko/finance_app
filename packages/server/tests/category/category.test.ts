import { closeTestApp, createUser, deleteUserAfterTest, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { TransactionType } from '../../src/types/TransactionType';
import { AccountStatusType } from 'tenpercent/shared';
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

afterAll(async () => {
    await closeTestApp(server, userIds);
});

describe('Category', () => {
    it(`POST - create category`, async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });

        userIds.push(userId);
        for (const { name } of [{ name: 'Test 1' }, { name: 'Test 2' }, { name: 'Test 3' }]) {
            const {
                body: {
                    data: { categoryId, categoryName },
                },
            } = await agent
                .post(`/user/${userId}/category/`)
                .set('authorization', authorization)
                .send({
                    currencyId: 1,
                    categoryName: name,
                    iconId: 'wallet',
                })
                .expect(HttpCode.OK);
            expect(categoryId).toBeTruthy();
            expect(categoryName).toStrictEqual(name);
        }
        for (const data of [
            {
                categoryName: 'Test 1',
            },
            {
                currencyId: 1,
            },
            {},
            {
                currencyId: '23',
                categoryName: 123123,
            },
            {
                currencyId: 1,
                categoryName:
                    'sdfsdfsdkjfdskfjhdsfkdsfhsdkfjhdsfkjdshfkdsfhdskfjhdskfjdshfdsjkfhdskjfhdsjkhfjkdshfjkhsdfjkdsjhfdjksfdshfjkdsfhdskfjhdsjkfjhdsfhkj',
            },
        ]) {
            await agent
                .post(`/user/${userId}/category/`)
                .set('authorization', authorization)
                .send(data)
                .expect(HttpCode.BAD_REQUEST);
        }
    });
    it(`PATCH - update category`, async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });

        userIds.push(userId);
        const obj = [
            { name: 'Test 1', id: null },
            { name: 'Test 2', id: null },
            { name: 'Test 3', id: null },
        ];
        let i = 0;
        for (const { name } of obj) {
            const {
                body: {
                    data: { categoryId, categoryName },
                },
            } = await agent
                .post(`/user/${userId}/category/`)
                .set('authorization', authorization)
                .send({
                    currencyId: 1,
                    categoryName: name,
                    iconId: 'wallet',
                })
                .expect(HttpCode.OK);
            expect(categoryId).toBeTruthy();
            expect(categoryName).toStrictEqual(name);
            obj[i]['id'] = categoryId;
            i += 1;
        }

        for (const { name, id } of obj) {
            await agent
                .patch(`/user/${userId}/category/${id}`)
                .set('authorization', authorization)
                .send({
                    categoryName: `${name}${id}`,
                })
                .expect(HttpCode.NO_CONTENT);
            const {
                body: {
                    data: { categoryId, categoryName },
                },
            } = await agent.get(`/user/${userId}/category/${id}`).set('authorization', authorization).expect(HttpCode.OK);

            expect(categoryId).toStrictEqual(id);
            expect(categoryName).toStrictEqual(`${name}${id}`);
        }
        for (const id of [999999999, 23129831, 238231]) {
            await agent
                .patch(`/user/${userId}/category/${id}`)
                .set('authorization', authorization)
                .send({
                    categoryName: `any`,
                })
                .expect(HttpCode.NOT_FOUND);
        }
        for (const id of ['sdsd', null, undefined, -1]) {
            await agent
                .patch(`/user/${userId}/category/${id}`)
                .set('authorization', authorization)
                .send({
                    categoryName: `any`,
                })
                .expect(HttpCode.BAD_REQUEST);
        }
        await agent
            .patch(`/user/${userId}/category/${obj[0].id}`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });
    it(`unknown properties`, async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });

        userIds.push(userId);
        await agent
            .post(`/user/${userId}/category/`)
            .set('authorization', authorization)
            .send({
                currencyId: 1,
                categoryName: 'Test',
                something: 200,
            })
            .expect(HttpCode.BAD_REQUEST);
        await agent.post(`/user/${userId}/category/`).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
        await agent
            .post(`/user/${userId}/category/?something=200`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
        await agent
            .get(`/user/${userId}/category/${21}`)
            .set('authorization', authorization)
            .send({
                something: 200,
            })
            .expect(HttpCode.NOT_FOUND);
        await agent
            .get(`/user/${userId}/category/${21}?something=200`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });
    it(`DELETE - delete category`, async () => {
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

        const {
            body: {
                data: { categoryId },
            },
        } = await agent
            .post(`/user/${userId}/category/`)
            .set('authorization', authorization)
            .send({
                currencyId: 1,
                categoryName: 'Test 1',
                iconId: 'wallet',
            })
            .expect(HttpCode.OK);
        const transactions = [
            {
                transactionTypeId: TransactionType.Expense,
                categoryId,
                amount: 1000,
                accountId: accounts[0].accountId,
            },
            {
                transactionTypeId: TransactionType.Expense,
                categoryId,
                amount: 1000,
                accountId: accounts[0].accountId,
            },
            {
                transactionTypeId: TransactionType.Expense,
                categoryId,
                amount: 1000,
                accountId: accounts[0].accountId,
            },
        ];

        const ids = [];

        for (const transaction of transactions) {
            const {
                body: {
                    data: { transactionId },
                },
            } = await agent
                .post(`/user/${userId}/transaction/`)
                .set('authorization', authorization)
                .send({
                    currencyId: 1,
                    targetCurrencyId: 1,
                    targetAmount: 1000,
                    description: 'Test',
                    ...transaction,
                    categoryId,
                })
                .expect(HttpCode.CREATED);
            ids.push(transactionId);
        }
        await agent.get(`/user/${userId}/category/${categoryId}`).set('authorization', authorization).expect(HttpCode.OK);
        await agent
            .patch(`/user/${userId}/category/${categoryId}`)
            .set('authorization', authorization)
            .send({
                status: AccountStatusType.Disable,
            })
            .expect(HttpCode.NO_CONTENT);
        for (const id of ids) {
            await agent.get(`/user/${userId}/transaction/${id}`).set('authorization', authorization).expect(HttpCode.OK);
        }
        for (const id of ids) {
            await agent
                .delete(`/user/${userId}/transaction/${id}`)
                .set('authorization', authorization)
                .expect(HttpCode.NO_CONTENT);
        }
        await agent
            .delete(`/user/${userId}/category/${categoryId}`)
            .set('authorization', authorization)
            .expect(HttpCode.NO_CONTENT);
        for (const id of ids) {
            await agent.get(`/user/${userId}/transaction/${id}`).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
        }
        await agent.delete(`/user/${userId}/category/99999999}`).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });
});
