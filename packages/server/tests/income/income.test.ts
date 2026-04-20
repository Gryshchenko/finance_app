import { createUser, deleteUserAfterTest, generateSecureRandom } from '../TestsUtils.';
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

let server: unknown;

let userIds: number[] = [];

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);

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

describe('Income', () => {
    it(`POST - create income`, async () => {
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
                    data: { incomeId, incomeName },
                },
            } = await agent
                .post(`/user/${userId}/income/`)
                .set('authorization', authorization)
                .send({
                    currencyId: 1,
                    incomeName: name,
                    iconId: 'test_icon',
                })
                .expect(HttpCode.OK);
            expect(incomeId).toBeTruthy();
            expect(incomeName).toStrictEqual(name);
        }
        for (const data of [
            {
                incomeName: 'Test 1',
            },
            {
                currencyId: 1,
            },
            {},
            {
                currencyId: '23',
                incomeName: 123123,
            },
            {
                currencyId: 1,
                incomeName:
                    'sdfsdfsdkjfdskfjhdsfkdsfhsdkfjhdsfkjdshfkdsfhdskfjhdskfjdshfdsjkfhdskjfhdsjkhfjkdshfjkhsdfjkdsjhfdjksfdshfjkdsfhdskfjhdsjkfjhdsfhkj',
            },
        ]) {
            await agent
                .post(`/user/${userId}/income/`)
                .set('authorization', authorization)
                .send(data)
                .expect(HttpCode.BAD_REQUEST);
        }
    });
    it(`PATCH - update income`, async () => {
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
                    data: { incomeId, incomeName },
                },
            } = await agent
                .post(`/user/${userId}/income/`)
                .set('authorization', authorization)
                .send({
                    currencyId: 1,
                    incomeName: name,
                    iconId: 'test_icon',
                })
                .expect(HttpCode.OK);
            expect(incomeId).toBeTruthy();
            expect(incomeName).toStrictEqual(name);
            obj[i]['id'] = incomeId;
            i += 1;
        }

        for (const { name, id } of obj) {
            await agent
                .patch(`/user/${userId}/income/${id}`)
                .set('authorization', authorization)
                .send({
                    incomeName: `${name}${id}`,
                })
                .expect(HttpCode.NO_CONTENT);
            const {
                body: {
                    data: { incomeId, incomeName },
                },
            } = await agent.get(`/user/${userId}/income/${id}`).set('authorization', authorization).expect(HttpCode.OK);

            expect(incomeId).toStrictEqual(id);
            expect(incomeName).toStrictEqual(`${name}${id}`);
        }
        for (const id of [999999999, 23129831, 238231]) {
            await agent
                .patch(`/user/${userId}/income/${id}`)
                .set('authorization', authorization)
                .send({
                    incomeName: `any`,
                })
                .expect(HttpCode.NOT_FOUND);
        }
        for (const id of ['sdsd', null, undefined, -1]) {
            await agent
                .patch(`/user/${userId}/income/${id}`)
                .set('authorization', authorization)
                .send({
                    incomeName: `any`,
                })
                .expect(HttpCode.BAD_REQUEST);
        }
        await agent.patch(`/user/${userId}/income/${obj[0].id}`).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
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
            .post(`/user/${userId}/income/`)
            .set('authorization', authorization)
            .send({
                currencyId: 1,
                incomeName: 'Test',
                something: 200,
            })
            .expect(HttpCode.BAD_REQUEST);
        await agent.post(`/user/${userId}/income/`).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
        await agent
            .post(`/user/${userId}/income/?something=200`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
        await agent
            .get(`/user/${userId}/income/${21}`)
            .set('authorization', authorization)
            .send({
                something: 200,
            })
            .expect(HttpCode.NOT_FOUND);
        await agent
            .get(`/user/${userId}/income/${21}?something=200`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });
    it(`DELETE - delete income`, async () => {
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
                data: { incomeId },
            },
        } = await agent
            .post(`/user/${userId}/income/`)
            .set('authorization', authorization)
            .send({
                currencyId: 1,
                incomeName: 'Test 1',
                iconId: 'test_icon',
            })
            .expect(HttpCode.OK);
        const transactions = [
            {
                transactionTypeId: TransactionType.Income,
                incomeId,
                amount: 1000,
                accountId: accounts[0].accountId,
            },
            {
                transactionTypeId: TransactionType.Income,
                incomeId,
                amount: 1000,
                accountId: accounts[0].accountId,
            },
            {
                transactionTypeId: TransactionType.Income,
                incomeId,
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
                    description: 'Test',
                    ...transaction,
                    incomeId,
                })
                .expect(HttpCode.CREATED);
            ids.push(transactionId);
        }
        await agent.get(`/user/${userId}/income/${incomeId}`).set('authorization', authorization).expect(HttpCode.OK);
        await agent
            .patch(`/user/${userId}/income/${incomeId}`)
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
        await agent.delete(`/user/${userId}/income/${incomeId}`).set('authorization', authorization).expect(HttpCode.NO_CONTENT);
        for (const id of ids) {
            await agent.get(`/user/${userId}/transaction/${id}`).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
        }
        await agent.delete(`/user/${userId}/income/99999999}`).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });
});
