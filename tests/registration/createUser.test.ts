// @ts-nocheck
import { generateRandomEmail, generateRandomPassword } from '../TestsUtils.';

const CryptoJS = require('crypto-js');
const request = require('supertest');
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

describe('Email Validation Tests', () => {
    // test('should accept a valid ASCII email', async () => {
    //     const response = await request(app)
    //         .post('/register/signup')
    //         .send({ email: 'gryshchenko@example.com', password: generateRandomPassword() });
    //     expect(response.statusCode).toBe(200);
    // });

    test('should reject an email with non-ASCII characters', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: 'tést@example.com', password: generateRandomPassword() });
        expect(response.statusCode).toBe(400);
    });

    test('should reject an email that is too long', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: 'thisisareallylongemailaddress@example.com', password: generateRandomPassword() });
        expect(response.statusCode).toBe(400);
    });
});
