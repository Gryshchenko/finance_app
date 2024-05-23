// @ts-nocheck
import { generateRandomEmail, generateRandomPassword } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';

const request = require('supertest');
require('dotenv').config();
const app = require('../../src/app');

jest.mock('../../src/services/profile/ProfileService', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => {
            return {
                createProfile: jest.fn().mockImplementation(() => Promise.reject(new Error('cant create profile'))),
            };
        }),
    };
});

describe('transaction POST /register/signup', () => {
    it('check DB transaction on crash createProfile', async () => {
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
