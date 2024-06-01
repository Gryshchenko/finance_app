// @ts-nocheck
import { generateRandomEmail, generateRandomPassword, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';

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
afterEach(() => {
    jest.restoreAllMocks();
});

jest.mock('../../src/services/emailConfirmation/EmailConfirmationService', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => {
            return {
                createConfirmationMail: jest
                    .fn()
                    .mockImplementation(() => Promise.reject(new Error('cant create confirmation mail'))),
            };
        }),
    };
});

describe('transaction POST /register/signup', () => {
    it('check DB transaction on crash createConfirmationMail', async () => {
        const mail = generateRandomEmail();
        const pass = generateRandomPassword();
        const response = await request(app).post('/register/signup').send({ email: mail, password: pass });

        const databaseConnection = new DatabaseConnection(config);
        const data = await databaseConnection.engine()('users').select('*').where({ email: mail });
        expect(data).toStrictEqual([]);
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 5001,
                },
            ],
            status: 2,
        });
    });
});
