import { closeTestApp, createUser, deleteUserAfterTest, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { TransactionType } from '../../src/types/TransactionType';
import { AccountStatusType } from '@tenpercent/shared';
import { HttpCode } from '@tenpercent/shared';

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

describe('Account', () => {
    it(`POST - create account`, async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });

        userIds.push(userId);
        for (const { amount: newAmount, name } of [
            { amount: 100, name: 'Test 1' },
            { amount: -100, name: 'Test 2' },
            { amount: 0, name: 'Test 3' },
        ]) {
            const {
                body: {
                    data: { accountId, amount, accountName },
                },
            } = await agent
                .post(`/user/${userId}/account/`)
                .set('authorization', authorization)
                .send({
                    currencyCode: 'USD',
                    accountName: name,
                    amount: newAmount,
                    iconId: 'wallet',
                })
                .expect(HttpCode.OK);
            expect(accountId).toBeTruthy();
            expect(Number(amount)).toStrictEqual(newAmount);
            expect(accountName).toStrictEqual(name);
        }
        for (const data of [
            {
                accountName: 'Test 1',
                amount: 1,
            },
            {
                currencyCode: 'USD',
                accountName: 'Test 1',
            },
            {
                currencyCode: 'USD',
                amount: 1,
            },
            {},
            {
                currencyCode: '23',
                amount: '213',
                accountName: 123123,
            },
            {
                currencyCode: 'USD',
                amount: 1231231231231231231231231232131231,
                accountName:
                    'sdfsdfsdkjfdskfjhdsfkdsfhsdkfjhdsfkjdshfkdsfhdskfjhdskfjdshfdsjkfhdskjfhdsjkhfjkdshfjkhsdfjkdsjhfdjksfdshfjkdsfhdskfjhdsjkfjhdsfhkj',
            },
        ]) {
            await agent
                .post(`/user/${userId}/account/`)
                .set('authorization', authorization)
                .send(data)
                .expect(HttpCode.BAD_REQUEST);
        }
    });
    it(`PATCH - update account`, async () => {
        const agent = request.agent(server);

        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });

        userIds.push(userId);
        const obj = [
            { amount: 100, name: 'Test 1', id: null },
            { amount: -100, name: 'Test 2', id: null },
            { amount: 0, name: 'Test 3', id: null },
        ];
        let i = 0;
        for (const { amount: newAmount, name } of obj) {
            const {
                body: {
                    data: { accountId, amount, accountName },
                },
            } = await agent
                .post(`/user/${userId}/account/`)
                .set('authorization', authorization)
                .send({
                    currencyCode: 'USD',
                    accountName: name,
                    amount: newAmount,
                    iconId: 'wallet',
                })
                .expect(HttpCode.OK);
            expect(accountId).toBeTruthy();
            expect(Number(amount)).toStrictEqual(newAmount);
            expect(accountName).toStrictEqual(name);
            obj[i]['id'] = accountId;
            i += 1;
        }

        for (const { amount: newAmount, name, id } of obj) {
            await agent
                .patch(`/user/${userId}/account/${id}`)
                .set('authorization', authorization)
                .send({
                    accountName: `${name}${id}`,
                    amount: newAmount + 1000,
                })
                .expect(HttpCode.NO_CONTENT);
            const {
                body: {
                    data: { accountId, amount, accountName },
                },
            } = await agent.get(`/user/${userId}/account/${id}`).set('authorization', authorization).expect(HttpCode.OK);

            expect(accountId).toStrictEqual(id);
            expect(Number(amount)).toStrictEqual(newAmount + 1000);
            expect(accountName).toStrictEqual(`${name}${id}`);
        }
        for (const id of [999999999, 23129831, 238231]) {
            await agent
                .patch(`/user/${userId}/account/${id}`)
                .set('authorization', authorization)
                .send({
                    accountName: `any`,
                    amount: 1000,
                })
                .expect(HttpCode.NOT_FOUND);
        }
        for (const id of ['sdsd', null, undefined, -1]) {
            await agent
                .patch(`/user/${userId}/account/${id}`)
                .set('authorization', authorization)
                .send({
                    accountName: `any`,
                    amount: 1000,
                })
                .expect(HttpCode.BAD_REQUEST);
        }
        await agent
            .patch(`/user/${userId}/account/${obj[0].id}`)
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
        await agent
            .post(`/user/${userId}/account/`)
            .set('authorization', authorization)
            .send({
                currencyCode: 'USD',
                accountName: 'Test',
                amount: 10,
                something: 200,
            })
            .expect(HttpCode.BAD_REQUEST);
        await agent.post(`/user/${userId}/account/`).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
        await agent
            .post(`/user/${userId}/account/?something=200`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
        await agent
            .get(`/user/${userId}/account/${21}`)
            .set('authorization', authorization)
            .send({
                something: 200,
            })
            .expect(HttpCode.NOT_FOUND);
        await agent
            .get(`/user/${userId}/account/${21}?something=200`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });
    it(`DELETE - delete account - hide`, async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });
        userIds.push(userId);
        const {
            body: {
                data: { incomes, categories, accounts },
            },
        } = await agent.get(`/user/${userId}/overview/`).set('authorization', authorization).send({}).expect(HttpCode.OK);

        const incomeId = incomes[0].incomeId;
        const categoryId = categories[0].categoryId;
        const targetAccountId = accounts[0].accountId;
        const {
            body: {
                data: { accountId },
            },
        } = await agent
            .post(`/user/${userId}/account/`)
            .set('authorization', authorization)
            .send({
                currencyCode: 'USD',
                accountName: 'Test 1',
                amount: 20000,
                iconId: 'wallet',
            })
            .expect(HttpCode.OK);
        const transactions = [
            {
                transactionTypeId: TransactionType.Income,
                incomeId,
            },
            {
                transactionTypeId: TransactionType.Expense,
                categoryId,
            },
            {
                transactionTypeId: TransactionType.Transafer,
                targetAccountId,
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
                    accountId,
                    currencyCode: 'USD',
                    targetCurrencyCode: 'USD',
                    amount: 1000,
                    targetAmount: 1000,
                    description: 'Test',
                    ...transaction,
                })
                .expect(HttpCode.CREATED);
            ids.push(transactionId);
        }
        await agent.get(`/user/${userId}/account/${accountId}`).set('authorization', authorization).expect(HttpCode.OK);
        await agent
            .patch(`/user/${userId}/account/${accountId}`)
            .set('authorization', authorization)
            .send({
                status: AccountStatusType.Disable,
            })
            .expect(HttpCode.NO_CONTENT);
        await agent.get(`/user/${userId}/account/${accountId}`).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
        for (const id of ids) {
            await agent.get(`/user/${userId}/transaction/${id}`).set('authorization', authorization).expect(HttpCode.OK);
        }
    });
    it(`DELETE - delete account - full`, async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });

        userIds.push(userId);
        const {
            body: {
                data: { incomes, categories, accounts },
            },
        } = await agent.get(`/user/${userId}/overview/`).set('authorization', authorization).send({}).expect(HttpCode.OK);

        const incomeId = incomes[0].incomeId;
        const categoryId = categories[0].categoryId;
        const targetAccountId = accounts[0].accountId;
        const {
            body: {
                data: { accountId },
            },
        } = await agent
            .post(`/user/${userId}/account/`)
            .set('authorization', authorization)
            .send({
                currencyCode: 'USD',
                accountName: 'Test 1',
                amount: 20000,
                iconId: 'wallet',
            })
            .expect(HttpCode.OK);
        const transactions = [
            {
                transactionTypeId: TransactionType.Income,
                incomeId,
            },
            {
                transactionTypeId: TransactionType.Expense,
                categoryId,
            },
            {
                transactionTypeId: TransactionType.Transafer,
                targetAccountId,
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
                    accountId,
                    currencyCode: 'USD',
                    targetCurrencyCode: 'USD',
                    amount: 1000,
                    targetAmount: 1000,
                    description: 'Test',
                    ...transaction,
                })
                .expect(HttpCode.CREATED);
            ids.push(transactionId);
        }
        await agent.get(`/user/${userId}/account/${accountId}`).set('authorization', authorization).expect(HttpCode.OK);
        for (const id of ids) {
            await agent.get(`/user/${userId}/transaction/${id}`).set('authorization', authorization).expect(HttpCode.OK);
        }
        await agent
            .delete(`/user/${userId}/account/${accountId}`)
            .set('authorization', authorization)
            .expect(HttpCode.NO_CONTENT);
        for (const id of ids) {
            await agent.get(`/user/${userId}/transaction/${id}`).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
        }
        await agent.delete(`/user/${userId}/account/99999999}`).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });
    it(`DELETE - delete account - keepData: false removes transactions`, async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });
        userIds.push(userId);
        const {
            body: {
                data: { incomes, categories, accounts },
            },
        } = await agent.get(`/user/${userId}/overview/`).set('authorization', authorization).send({}).expect(HttpCode.OK);

        const incomeId = incomes[0].incomeId;
        const categoryId = categories[0].categoryId;
        const targetAccountId = accounts[0].accountId;
        const {
            body: {
                data: { accountId },
            },
        } = await agent
            .post(`/user/${userId}/account/`)
            .set('authorization', authorization)
            .send({
                currencyCode: 'USD',
                accountName: 'Test keepData false',
                amount: 20000,
                iconId: 'wallet',
            })
            .expect(HttpCode.OK);
        const transactions = [
            { transactionTypeId: TransactionType.Income, incomeId },
            { transactionTypeId: TransactionType.Expense, categoryId },
            { transactionTypeId: TransactionType.Transafer, targetAccountId },
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
                    accountId,
                    currencyCode: 'USD',
                    targetCurrencyCode: 'USD',
                    amount: 1000,
                    targetAmount: 1000,
                    description: 'Test',
                    ...transaction,
                })
                .expect(HttpCode.CREATED);
            ids.push(transactionId);
        }
        await agent
            .delete(`/user/${userId}/account/${accountId}`)
            .set('authorization', authorization)
            .send({ keepData: false })
            .expect(HttpCode.NO_CONTENT);
        await agent.get(`/user/${userId}/account/${accountId}`).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
        for (const id of ids) {
            await agent.get(`/user/${userId}/transaction/${id}`).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
        }
    });
    it(`DELETE - delete account - keepData: true preserves transactions`, async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection,
        });
        userIds.push(userId);
        const {
            body: {
                data: { incomes, categories, accounts },
            },
        } = await agent.get(`/user/${userId}/overview/`).set('authorization', authorization).send({}).expect(HttpCode.OK);

        const incomeId = incomes[0].incomeId;
        const categoryId = categories[0].categoryId;
        const targetAccountId = accounts[0].accountId;
        const {
            body: {
                data: { accountId },
            },
        } = await agent
            .post(`/user/${userId}/account/`)
            .set('authorization', authorization)
            .send({
                currencyCode: 'USD',
                accountName: 'Test keepData true',
                amount: 20000,
                iconId: 'wallet',
            })
            .expect(HttpCode.OK);
        const transactions = [
            { transactionTypeId: TransactionType.Income, incomeId },
            { transactionTypeId: TransactionType.Expense, categoryId },
            { transactionTypeId: TransactionType.Transafer, targetAccountId },
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
                    accountId,
                    currencyCode: 'USD',
                    targetCurrencyCode: 'USD',
                    amount: 1000,
                    targetAmount: 1000,
                    description: 'Test',
                    ...transaction,
                })
                .expect(HttpCode.CREATED);
            ids.push(transactionId);
        }
        await agent
            .delete(`/user/${userId}/account/${accountId}`)
            .set('authorization', authorization)
            .send({ keepData: true })
            .expect(HttpCode.NO_CONTENT);
        await agent.get(`/user/${userId}/account/${accountId}`).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
        for (const id of ids) {
            await agent.get(`/user/${userId}/transaction/${id}`).set('authorization', authorization).expect(HttpCode.OK);
        }
    });
});
