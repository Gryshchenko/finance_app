// @ts-nocheck
import { deleteUserAfterTest, generateRandomEmail, generateRandomPassword, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';

const request = require('supertest');
require('dotenv').config();
const app = require('../../src/app');

let server;

let userIds = [];

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);

    server = app.listen(port);
});

afterAll((done) => {
    userIds.forEach((id) => {
        deleteUserAfterTest(id, DatabaseConnection.instance(config));
    });
    userIds = [];
    server.close(done);
});

describe('POST /transaction/create - transfare', () => {
    [10, 20, 32, 42.23, 4342, 342425, 32424.34, 324234.54, 5345345.345345, 5345345346.4554].forEach(async (num) => {
        await it(`should create new transaction num: ${num}`, async () => {
            const agent = request.agent(app);

            const create_user = await agent
                .post('/register/signup')
                .send({ email: generateRandomEmail(5), password: generateRandomPassword() })
                .expect(200);
            // @ts-ignore
            userIds.push(create_user.body.data.userId);
            const overview = await agent
                .get(`/user/${create_user.body.data.userId}/overview/`)
                .set('authorization', create_user.header['authorization'])
                .send({})
                .expect(200);
            const {
                body: {
                    data: { accounts, categories, incomes },
                },
            } = overview;

            const incomeId = incomes[0].incomeId;
            const accountId = accounts[0].accountId;
            const currencyId = accounts[0].currencyId;
            const targetAccountId = accounts[1].accountId;

            const {
                body: { data: accountBefor },
            } = await agent
                .get(`/user/${create_user.body.data.userId}/account/${accountId}`)
                .set('authorization', create_user.header['authorization'])
                .send({})
                .expect(200);

            const {
                body: { data: targetAccountBefor },
            } = await agent
                .get(`/user/${create_user.body.data.userId}/account/${targetAccountId}`)
                .set('authorization', create_user.header['authorization'])
                .send({})
                .expect(200);
            const response = await agent
                .post(`/user/${create_user.body.data.userId}/transaction/`)
                .set('authorization', create_user.header['authorization'])
                .send({
                    accountId,
                    currencyId,
                    transactionTypeId: 3,
                    targetAccountId,
                    amount: num,
                    description: 'Test',
                })
                .expect(201);
            const {
                body: { data: accountAfter },
            } = await agent
                .get(`/user/${create_user.body.data.userId}/account/${accountId}`)
                .set('authorization', create_user.header['authorization'])
                .send({})
                .expect(200);
            const {
                body: { data: targetAccountAfter },
            } = await agent
                .get(`/user/${create_user.body.data.userId}/account/${targetAccountId}`)
                .set('authorization', create_user.header['authorization'])
                .send({})
                .expect(200);
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
        const agent = request.agent(app);

        const create_user = await agent
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() })
            .expect(200);
        // @ts-ignore
        userIds.push(create_user.body.data.userId);
        const response = await agent
            .post(`/user/${create_user.body.data.userId}/transaction/`)
            .set('authorization', create_user.header['authorization'])
            .send({
                accountId: 21,
                transactionTypeId: 3,
                amount: 1000,
                description: 'Test',
            })
            .expect(400);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: 7005 }],
            status: 2,
        });
    });
    it('should not create new transaction - miss accountId', async () => {
        const agent = request.agent(app);

        const create_user = await agent
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() })
            .expect(200);
        // @ts-ignore
        userIds.push(create_user.body.data.userId);
        const response = await agent
            .post(`/user/${create_user.body.data.userId}/transaction/`)
            .set('authorization', create_user.header['authorization'])
            .send({
                transactionTypeId: 3,
                amount: 1000,
                description: 'Test',
            })
            .expect(400);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: 7005 }],
            status: 2,
        });
    });
    it('should not create new transaction - miss targetAccountId and accountId', async () => {
        const agent = request.agent(app);

        const create_user = await agent
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() })
            .expect(200);
        // @ts-ignore
        userIds.push(create_user.body.data.userId);
        const response = await agent
            .post(`/user/${create_user.body.data.userId}/transaction/`)
            .set('authorization', create_user.header['authorization'])
            .send({
                transactionTypeId: 3,
                amount: 1000,
                description: 'Test',
            })
            .expect(400);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: 7005 }],
            status: 2,
        });
    });
    it('should not create new transaction - miss amount', async () => {
        const agent = request.agent(app);

        const create_user = await agent
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() })
            .expect(200);
        // @ts-ignore
        userIds.push(create_user.body.data.userId);
        const response = await agent
            .post(`/user/${create_user.body.data.userId}/transaction/`)
            .set('authorization', create_user.header['authorization'])
            .send({
                accountId: 5,
                targetAccountId: 5,
                transactionTypeId: 3,
                description: 'Test',
            })
            .expect(400);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: 7006 }],
            status: 2,
        });
    });
    it('should not create new transaction - not allow unknown properties', async () => {
        const agent = request.agent(app);

        const create_user = await agent
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() })
            .expect(200);
        const response = await agent
            .post(`/user/${create_user.body.data.userId}/transaction/`)
            .set('authorization', create_user.header['authorization'])
            .send({
                accountId: 5,
                targetAccountId: 5,
                currencyId: 1,
                transactionTypeId: 3,
                amount: 1000,
                description: 'Test',
                test: 'unknown',
            })
            .expect(400);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: 1 }],
            status: 2,
        });
    });
});
