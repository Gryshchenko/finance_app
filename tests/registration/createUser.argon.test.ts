// @ts-nocheck
import { generateRandomEmail, generateRandomPassword, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { LanguageType } from '../../src/types/LanguageType';
import { user_initial } from '../../src/config/user_initial';
import currency_initial from '../../src/config/currency_initial';

const request = require('supertest');
require('dotenv').config();
const app = require('../../src/app');

jest.mock('argon2', () => ({
    hash: jest.fn().mockRejectedValue(new Error('Mocked failure')),
}));

let server;

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);

    server = app.listen(port);
});

afterAll((done) => {
    server.close(done);
});

describe('POST /register/signup', () => {
    it('argon2 crashed: should return error', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() });

        console.log(response.status);
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
