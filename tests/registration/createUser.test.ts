// @ts-nocheck
import { generateRandomEmail, generateRandomPassword } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { LanguageType } from '../../src/types/LanguageType';
import { user_initial } from '../../src/config/user_initial';
import currency_initial from '../../src/config/currency_initial';

const CryptoJS = require('crypto-js');
const request = require('supertest');
require('dotenv').config();
const app = require('../../src/app');

afterEach(() => {
    jest.restoreAllMocks();
});

describe('POST /register/signup', () => {
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

    const testCases = [LanguageType.US, LanguageType.FR, LanguageType.DK, LanguageType.DE, 'aa_AA'];
    testCases.forEach((locale) => {
        it(`check users accounts, incomes, category for locale: ${locale}`, async () => {
            const mail = generateRandomEmail();

            const initialData = user_initial[locale] ?? user_initial[LanguageType.US];
            const initialCurrency = currency_initial[locale] ?? currency_initial[LanguageType.US];
            const pass = generateRandomPassword();
            const response = await request(app).post('/register/signup').send({ email: mail, password: pass, locale });
            const databaseConnection = new DatabaseConnection(config);
            const user = await databaseConnection.engine()('users').select('*').where({ email: mail }).first();
            const accounts = await databaseConnection.engine()('accounts').select('*').where({ userId: user.userId });
            const categories = await databaseConnection.engine()('categories').select('*').where({ userId: user.userId });
            const incomes = await databaseConnection.engine()('incomes').select('*').where({ userId: user.userId });
            expect(
                accounts.map((data) => ({
                    userId: data.userId,
                    accountName: data.accountName,
                    amount: data.amount,
                })),
            ).toEqual(
                initialData.accounts.map((data) => ({
                    userId: user.userId,
                    accountName: data,
                    amount: '0',
                })),
            );
            expect(
                categories.map((data) => ({
                    categoryName: data.categoryName,
                    userId: data.userId,
                })),
            ).toEqual(
                initialData.categories.map((data) => ({
                    categoryName: data,
                    userId: user.userId,
                })),
            );
            expect(
                incomes.map((data) => ({
                    userId: data.userId,
                    incomeName: data.incomeName,
                })),
            ).toEqual(
                initialData.income.map((data) => ({
                    userId: user.userId,
                    incomeName: data,
                })),
            );

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({
                status: 1,
                data: {
                    email: mail,
                    status: 1,
                    currency: initialCurrency,
                    profile: { locale },
                    additionalInfo: null,
                },
                errors: [],
            });
        });
    });
});
