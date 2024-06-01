// @ts-nocheck
import { generateRandomEmail, generateRandomPassword, generateSecureRandom } from '../TestsUtils.';

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
