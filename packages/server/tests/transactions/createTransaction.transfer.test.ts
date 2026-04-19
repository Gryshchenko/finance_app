import { createUser, deleteUserAfterTest, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { ErrorCode } from 'tenpercent/shared';
import { ResponseStatusType } from 'tenpercent/shared';
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
