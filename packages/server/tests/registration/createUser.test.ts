import {
    createUser,
    deleteUserAfterTest,
    generateRandomEmail,
    generateRandomName,
    generateRandomPassword,
    generateRandomString,
    generateSecureRandom,
} from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { user_initial } from 'src/config/user_initial';
import { LanguageType } from 'tenpercent/shared';
import { UserStatus } from 'tenpercent/shared';
import { ResponseStatusType } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';
import { HttpCode } from 'tenpercent/shared';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const argon2 = require('argon2');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

let server: never;

const userIds: number[] = [];

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);

    // @ts-expect-error is necessary
    server = app.listen(port);
});

afterAll((done) => {
    userIds.forEach(async (id) => {
        await deleteUserAfterTest(id, DatabaseConnection.instance(config));
    });
    // @ts-expect-error is necessary
    server.close(done);
});

describe('POST /register/signup', () => {
    it('should return error for invalid locale format', async () => {
        const response = await request(app).post('/register/signup').send({
            email: generateRandomEmail(),
            password: generateRandomPassword(),
            locale: 213123,
            publicName: generateRandomName(),
            currencyCode: 'USD',
        });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.LOCALE_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'locale',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should return error for invalid email format', async () => {
        const response = await request(app).post('/register/signup').send({
            currencyCode: 'USD',
            email: 'invalid-email',
            password: generateRandomPassword(),
            publicName: generateRandomName(),
        });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.EMAIL_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'email',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should return error for invalid email format', async () => {
        const response = await request(app).post('/register/signup').send({
            currencyCode: 'USD',
            email: 'example.com',
            password: generateRandomPassword(),
            publicName: generateRandomName(),
        });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.EMAIL_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'email',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should return error for invalid email format', async () => {
        const response = await request(app).post('/register/signup').send({
            currencyCode: 'USD',
            email: 'example@',
            password: generateRandomPassword(),
            publicName: generateRandomName(),
        });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.EMAIL_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'email',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should return error for invalid email format', async () => {
        const response = await request(app).post('/register/signup').send({
            currencyCode: 'USD',
            email: 'example@test@com',
            password: generateRandomPassword(),
            publicName: generateRandomName(),
        });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.EMAIL_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'email',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should return error for invalid email format', async () => {
        const publicName = generateRandomName();
        const response = await request(app).post('/register/signup').send({
            email: null,
            currencyCode: 'USD',
            password: generateRandomPassword(),
            publicName,
        });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.EMAIL_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'email',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should return error for too short password', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({
                currencyCode: 'USD',
                email: 'test_test@gmail.com',
                password: generateRandomPassword(5),
                publicName: generateRandomName(),
            });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.PASSWORD_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'password',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should return error for too big password', async () => {
        const response = await request(app)
            .post('/register/signup')
            .send({
                currencyCode: 'USD',
                email: generateRandomEmail(),
                password: generateRandomPassword(31),
                publicName: generateRandomName(),
            });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.PASSWORD_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'password',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should return error invalid format password', async () => {
        const response = await request(app).post('/register/signup').send({
            currencyCode: 'USD',
            email: 'google_test1@test.com',
            password: generateSecureRandom(),
            publicName: generateRandomName(),
        });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.PASSWORD_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'password',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should return error invalid format password', async () => {
        const response = await request(app)
            .post('/register/signup')

            .send({
                currencyCode: 'USD',
                email: 'google_test2@test.com',
                password: generateRandomString(5),
                publicName: generateRandomName(),
            });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.PASSWORD_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'password',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should return error invalid format password', async () => {
        const publicName = generateRandomName();
        const response = await request(app).post('/register/signup').send({
            currencyCode: 'USD',
            email: 'google_test3@test.com',
            password: null,
            publicName,
        });

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.PASSWORD_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'password',
                        reason: 'invalid',
                    },
                },
                {
                    errorCode: ErrorCode.PASSWORD_INVALID_ERROR,
                    msg: expect.any(String),
                    payload: {
                        field: 'password',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should hash the password before saving to database', async () => {
        const spy = jest.spyOn(argon2, 'hash');
        const mail = generateRandomEmail();
        const publicName = generateRandomName();
        const response = await request(app).post('/register/signup').send({
            currencyCode: 'USD',
            email: mail,
            password: generateRandomPassword(),
            publicName,
        });

        userIds.push(response.body.data.userId);
        expect(response.body).toStrictEqual({
            status: ResponseStatusType.OK,
            data: {
                email: mail,
                status: UserStatus.NO_VERIFIED,
                token: expect.any(String),
                tokenLong: expect.any(String),
                userId: expect.any(Number),
            },
            errors: [],
        });
        expect(spy).toHaveBeenCalled();
    });
    it('should failed email already exist', async () => {
        const mail = generateRandomEmail();
        const publicName = generateRandomName();
        const {
            body: {
                data: { userId },
            },
        } = await request(app).post('/register/signup').send({
            currencyCode: 'USD',
            email: mail,
            password: generateRandomPassword(),
            publicName,
        });
        const response = await request(app).post('/register/signup').send({
            currencyCode: 'USD',
            email: mail,
            password: generateRandomPassword(),
            publicName,
        });
        userIds.push(userId);
        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.SIGNUP_USER_ALREADY_EXISTS_ERROR,
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });
    it('should failed currencyCode miss', async () => {
        const mail = generateRandomEmail();
        const publicName = generateRandomName();
        const response = await request(app).post('/register/signup').send({
            email: mail,
            password: generateRandomPassword(),
            publicName,
        });
        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.UNKNOWN_ERROR,
                    msg: 'Field currencyCode must be a string',
                    payload: {
                        field: 'currencyCode',
                        reason: 'invalid',
                    },
                },
            ],
            status: ResponseStatusType.INTERNAL,
        });
    });

    const testCases = [LanguageType.US, LanguageType.FR, LanguageType.DK, LanguageType.DE, 'aa-AA'];
    testCases.forEach((locale) => {
        it(`check users accounts, incomes, category for locale: ${locale}`, async () => {
            const databaseConnection = new DatabaseConnection(config);

            const agent = request.agent(app);
            const initialData = user_initial[locale as LanguageType] ?? user_initial[LanguageType.US];
            const password = generateRandomPassword();
            const email = generateRandomEmail();
            const publicName = generateRandomName();
            const { userId, authorization } = await createUser({
                password,
                email,
                publicName,
                locale: locale as LanguageType,
                agent,
                databaseConnection,
            });
            expect(userId).toEqual(expect.any(Number));
            const user = await databaseConnection.engine()('users').select('*').where({ email, userId }).first();
            const profile = await databaseConnection
                .engine()('profiles')
                .select('*')
                .innerJoin('email_confirmations', 'profiles.userId', 'email_confirmations.userId')
                .where({ 'profiles.userId': user.userId })
                .first();
            const accounts = await databaseConnection.engine()('accounts').select('*').where({ userId: user.userId });
            const categories = await databaseConnection.engine()('categories').select('*').where({ userId: user.userId });
            const incomes = await databaseConnection.engine()('incomes').select('*').where({ userId: user.userId });
            const balance = await databaseConnection.engine()('balance').select('*').where({ userId: user.userId });
            expect(profile.publicName).toStrictEqual(publicName);
            expect(profile.locale).toStrictEqual(locale === 'aa-AA' ? LanguageType.US : locale);
            expect(profile.userId).toStrictEqual(userId);

            expect(balance.length).toBe(1);
            expect(balance[0].userId).toBe(user.userId);
            expect(balance[0].balance).toBe('0');
            userIds.push(user.userId);
            expect(
                accounts.map((data) => ({
                    userId: data.userId,
                    accountName: data.accountName,
                    amount: data.amount,
                })),
            ).toEqual(
                expect.arrayContaining(
                    initialData.accounts.map((data: unknown) => ({
                        userId: user.userId,
                        accountName: data,
                        amount: '0',
                    })),
                ),
            );
            expect(
                categories.map((data) => ({
                    categoryName: data.categoryName,
                    userId: data.userId,
                })),
            ).toEqual(
                expect.arrayContaining(
                    initialData.categories.map((data: unknown) => ({
                        categoryName: data,
                        userId: user.userId,
                    })),
                ),
            );
            expect(
                incomes.map((data) => ({
                    userId: data.userId,
                    incomeName: data.incomeName,
                })),
            ).toEqual(
                expect.arrayContaining(
                    initialData.income.map((data: unknown) => ({
                        userId: user.userId,
                        incomeName: data,
                    })),
                ),
            );
            const {
                body: { data },
            } = await agent.get(`/user/${userId}`).set('authorization', authorization);
            expect(data.email).toBe(email);
            expect(data.status).toBe(UserStatus.ACTIVE);
            const profileResponse = await agent.get(`/user/${userId}/profile`).set('authorization', authorization);

            expect(profileResponse.body).toStrictEqual({
                status: ResponseStatusType.OK,
                data: {
                    publicName: publicName,
                    mailConfirmed: true,
                    profileId: profile.profileId,
                    currencyId: profile.currencyId,
                    locale: profile.locale,
                },
                errors: [],
            });
        });
    });
});
