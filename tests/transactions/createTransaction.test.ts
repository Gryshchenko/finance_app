// @ts-nocheck
import { generateRandomEmail, generateRandomPassword, generateRandomString, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { LanguageType } from '../../src/types/LanguageType';
import { user_initial } from '../../src/config/user_initial';
import currency_initial from '../../src/config/currency_initial';

const argon2 = require('argon2');
const request = require('supertest');
require('dotenv').config();
const app = require('../../src/app');

let server;

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);

    server = app.listen(port);
});

afterAll((done) => {
    server.close(done);
});

describe('POST /transaction/create - income', () => {
    it('should create new transaction', async () => {
        const agent = request.agent(app);

        const create_user = await agent
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() })
            .expect(200);
        const response = await agent
            .post(`/user/${create_user.body.data.userId}/transaction/`)
            .set('authorization', create_user.header['authorization'])
            .send({
                incomeId: 21,
                accountId: 21,
                currencyId: 1,
                transactionTypeId: 1,
                amount: 1000,
                description: 'Test',
            })
            .expect(201);

        const databaseConnection = new DatabaseConnection(config);
        await databaseConnection.engine()('transactions').delete().where({ transactionId: response.body.data.transactionId });
        expect(response.body).toStrictEqual({
            data: {
                transactionId: expect.any(Number),
            },
            errors: [],
            status: 1,
        });
    });
    it('should not create new transaction with categoryId', async () => {
        const agent = request.agent(app);

        const create_user = await agent
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() })
            .expect(200);
        const response = await agent
            .post(`/user/${create_user.body.data.userId}/transaction/`)
            .set('authorization', create_user.header['authorization'])
            .send({
                incomeId: 21,
                accountId: 21,
                currencyId: 1,
                categoryId: 233,
                transactionTypeId: 1,
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
    it('should not create new transaction - miss incomeId', async () => {
        const agent = request.agent(app);

        const create_user = await agent
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() })
            .expect(200);
        const response = await agent
            .post(`/user/${create_user.body.data.userId}/transaction/`)
            .set('authorization', create_user.header['authorization'])
            .send({
                accountId: 21,
                currencyId: 1,
                transactionTypeId: 1,
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
        const response = await agent
            .post(`/user/${create_user.body.data.userId}/transaction/`)
            .set('authorization', create_user.header['authorization'])
            .send({
                incomeId: 21,
                currencyId: 1,
                transactionTypeId: 1,
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
    it('should not create new transaction - miss incomeId and accountId', async () => {
        const agent = request.agent(app);

        const create_user = await agent
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() })
            .expect(200);
        const response = await agent
            .post(`/user/${create_user.body.data.userId}/transaction/`)
            .set('authorization', create_user.header['authorization'])
            .send({
                currencyId: 1,
                transactionTypeId: 1,
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
    it('should not create new transaction - miss currency', async () => {
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
                incomeId: 5,
                transactionTypeId: 1,
                amount: 1000,
                description: 'Test',
            })
            .expect(400);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: 7004 }],
            status: 2,
        });
    });
    it('should not create new transaction - trysactionTypeId', async () => {
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
                incomeId: 5,
                currencyId: 1,
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
    it('should not create new transaction - amount', async () => {
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
                incomeId: 5,
                currencyId: 1,
                transactionTypeId: 1,
                description: 'Test',
            })
            .expect(400);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: 7006 }],
            status: 2,
        });
    });
    it('should not create new transaction - description', async () => {
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
                incomeId: 5,
                currencyId: 1,
                transactionTypeId: 1,
                amount: 1000,
            })
            .expect(400);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: 7007 }],
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
                incomeId: 5,
                currencyId: 1,
                transactionTypeId: 1,
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
