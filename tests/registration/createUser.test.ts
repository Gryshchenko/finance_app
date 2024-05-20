// @ts-nocheck
import { generateRandomEmail, generateRandomPassword } from '../TestsUtils.';
import UserService from '../../src/services/user/UserService';
import UserDataService from '../../src/services/user/UserDataAccess';

const CryptoJS = require('crypto-js');
const request = require('supertest');
// config.js
require('dotenv').config();
const app = require('../../src/app');

describe('POST /register/signup', () => {
    it('should authenticate with correct credentials', async () => {
        const mail = generateRandomEmail();
        const pass = generateRandomPassword();
        const response = await request(app).post('/register/signup').send({ email: mail, password: pass });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            status: 1,
            data: {
                email: mail,
                status: 1,
                currency: { currencyCode: 'USD', currencyName: 'US Dollar', symbol: '$' },
                profile: { locale: 'en-US' },
                additionalInfo: null,
            },
            errors: [],
        });
    });
    it('should return error for invalid email format to big', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: generateRandomEmail(31), password: generateRandomPassword() });

        console.log(response);
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4000,
                    msg: 'Invalid value',
                },
            ],
            status: 2,
        });
    });
    it('should return error for invalid email format', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: 'invalid-email', password: generateRandomPassword() });

        console.log(response);
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4000,
                    msg: 'Invalid value',
                },
            ],
            status: 2,
        });
    });
    it('should return error for too short password', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword(5) });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4002,
                    msg: 'Invalid value',
                },
            ],
            status: 2,
        });
    });
    it('should return error for too big password', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword(31) });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4002,
                    msg: 'Invalid value',
                },
            ],
            status: 2,
        });
    });
    it('should not allow duplicate email registration', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: 'gryshchenko.89@gmail.com', password: 'sdfD@jskdfh123' });

        expect(response.status).toBe(409); // Или другой соответствующий статус-код
        expect(response.body).toEqual({
            status: 0,
            errors: ['Email already in use'],
        });
    });
    // it('should handle server errors gracefully', async () => {
    //     jest.spyOn(new UserDataService(), 'getUserAuthenticationData').mockImplementationOnce(() =>
    //         Promise.reject(new Error('Database error')),
    //     );
    //
    //     const response = await request(app)
    //         .post('/register/signup')
    //         .send({ email: generateRandomEmail(), password: generateRandomEmail() });
    //
    //     expect(response.status).toBe(500);
    //     expect(response.body).toEqual({
    //         status: 0,
    //         errors: ['Internal server error'],
    //     });
    // });
    it('should hash the password before saving to database', async () => {
        const spy = jest.spyOn(CryptoJS, 'PBKDF2');
        const mail = generateRandomEmail();
        const response = await request(app).post('/register/signup').send({ email: mail, password: generateRandomPassword() });

        expect(response.body).toStrictEqual({
            status: 1,
            data: {
                email: mail,
                status: 1,
                currency: { currencyCode: 'USD', currencyName: 'US Dollar', symbol: '$' },
                profile: { locale: 'en-US' },
                additionalInfo: null,
            },
            errors: [],
        });
        expect(spy).toHaveBeenCalled();
    });
});
