// @ts-nocheck
import { generateRandomEmail, generateRandomPassword } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';

const CryptoJS = require('crypto-js');
const request = require('supertest');
require('dotenv').config();
const app = require('../../src/app');

afterEach(() => {
    jest.restoreAllMocks();
});

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
    it('should authenticate with correct credentials with locale euro', async () => {
        const mail = generateRandomEmail();
        const pass = generateRandomPassword();
        const locale = 'fr-FR';
        const response = await request(app).post('/register/signup').send({ email: mail, password: pass, locale });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            status: 1,
            data: {
                email: mail,
                status: 1,
                currency: { currencyCode: 'EUR', currencyName: 'Euro', symbol: '€' },
                profile: { locale },
                additionalInfo: null,
            },
            errors: [],
        });
    });
    it('should authenticate with correct credentials with locale DKK', async () => {
        const mail = generateRandomEmail();
        const pass = generateRandomPassword();
        const locale = 'da-DK';
        const response = await request(app).post('/register/signup').send({ email: mail, password: pass, locale });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            status: 1,
            data: {
                email: mail,
                status: 1,
                currency: { currencyCode: 'DKK', currencyName: 'Danish Krone', symbol: 'kr' },
                profile: { locale },
                additionalInfo: null,
            },
            errors: [],
        });
    });

    it('should authenticate with correct credentials with locale un support locale en_MY', async () => {
        const mail = generateRandomEmail();
        const pass = generateRandomPassword();
        const locale = 'en-MY';
        const response = await request(app).post('/register/signup').send({ email: mail, password: pass, locale });

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
    it('should return error for invalid locale format', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword(), locale: 213123 });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4009,
                },
            ],
            status: 2,
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
                },
            ],
            status: 2,
        });
    });
    it('should return error for invalid email format', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: 'invalid-email', password: generateRandomPassword() });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4000,
                },
            ],
            status: 2,
        });
    });
    it('should return error for invalid email format', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: 'example.com', password: generateRandomPassword() });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4000,
                },
            ],
            status: 2,
        });
    });
    it('should return error for invalid email format', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: 'example@', password: generateRandomPassword() });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4000,
                },
            ],
            status: 2,
        });
    });
    it('should return error for invalid email format', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({ email: 'example@test@com', password: generateRandomPassword() });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4000,
                },
            ],
            status: 2,
        });
    });
    it('should return error for invalid email format', async () => {
        const response = await request(app).post('/register/signup').send({ email: null, password: generateRandomPassword() });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4000,
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
                },
            ],
            status: 2,
        });
    });
    it('should return error invalid format password', async () => {
        const response = await request(app).post('/register/signup').send({ email: generateRandomEmail(), password: '123456' });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4002,
                },
            ],
            status: 2,
        });
    });
    it('should return error invalid format password', async () => {
        const response = await request(app).post('/register/signup').send({ email: generateRandomEmail(), password: 'password' });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4002,
                },
            ],
            status: 2,
        });
    });
    it('should return error invalid format password', async () => {
        const response = await request(app).post('/register/signup').send({ email: generateRandomEmail(), password: null });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 4002,
                },
                {
                    errorCode: 4002,
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
