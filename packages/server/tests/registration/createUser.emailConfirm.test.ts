import {
    createUserNotVerify,
    deleteUserAfterTest,
    generateRandomEmail,
    generateRandomName,
    generateRandomPassword,
    generateSecureRandom,
} from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { ErrorCode, LanguageType, UserStatus } from 'tenpercent/shared';
import { HttpCode } from 'tenpercent/shared';
import TimeManagerUTC from '../../src/utils/TimeManagerUTC';

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
    server.closeAllConnections();
    // @ts-expect-error is necessary
    server.close(done);
});

describe('POST /register/signup/emailConfirm', () => {
    it(`verify email confirmation logic`, async () => {
        const databaseConnection = new DatabaseConnection(config);
        const timeManager = new TimeManagerUTC();
        timeManager.subtractTime(1, 1, 1);
        const agent = request.agent(server);
        const password = generateRandomPassword();
        const email = generateRandomEmail();
        const publicName = generateRandomName();
        const { userId, authorization } = await createUserNotVerify({
            password,
            email,
            publicName,
            locale: LanguageType.US,
            agent,
        });
        expect(userId).toEqual(expect.any(Number));

        const profileBefore = await agent.get(`/user/${userId}/profile`).set('authorization', authorization);
        expect(profileBefore.status).toBe(HttpCode.FORBIDDEN);
        for (const code of ['qwe', '123qwe', 'qeereeqq', null, undefined]) {
            const confirmMailResponse = await agent
                .post(`/register/signup/${userId}/email-confirmation/verify`)
                .set('authorization', authorization)
                .send({ confirmationCode: code });
            expect(confirmMailResponse.status).toBe(HttpCode.BAD_REQUEST);
            expect(confirmMailResponse.body.errors).toStrictEqual([
                {
                    errorCode: expect.any(Number),
                    msg: expect.any(String),
                    payload: { field: 'confirmationCode', reason: 'validation:codeInvalided' },
                },
            ]);
        }
        const failedTest2 = await agent
            .post(`/register/signup/${111111111}/email-confirmation/resend`)
            .set('authorization', authorization);
        expect(failedTest2.status).toBe(HttpCode.UNAUTHORIZED);
        const failedTest1 = await agent
            .post(`/register/signup/${1111111111}/email-confirmation/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode: 11111111 });
        expect(failedTest1.status).toBe(HttpCode.UNAUTHORIZED);

        const confirmMailResponse = await agent
            .post(`/register/signup/${userId}/email-confirmation/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode: 11111111 });
        expect(confirmMailResponse.status).toBe(HttpCode.BAD_REQUEST);
        expect(confirmMailResponse.body.errors).toStrictEqual([
            {
                errorCode: expect.any(Number),
                payload: { field: 'confirmationCode', reason: 'validation:codeInvalided' },
            },
        ]);
        await databaseConnection
            .engine()('email_confirmations')
            .update({ expiresAt: timeManager.getCurrentTime() })
            .where({ userId, email });

        const confirmation = await databaseConnection
            .engine()('email_confirmations')
            .select(['confirmationCode'])
            .where({ userId, email })
            .first();
        const confirmMail = await agent
            .post(`/register/signup/${userId}/email-confirmation/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode: confirmation.confirmationCode });
        expect(confirmMail.status).toBe(HttpCode.BAD_REQUEST);
        expect(confirmMail.body.errors).toStrictEqual([
            {
                errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                payload: {
                    field: 'confirmationCode',
                    reason: 'validation:codeExpired',
                },
            },
        ]);
        const resendRequest = await agent
            .post(`/register/signup/${userId}/email-confirmation/resend`)
            .set('authorization', authorization);
        expect(resendRequest.status).toBe(HttpCode.OK);

        const userBefore = await agent.get(`/user/${userId}`).set('authorization', authorization);
        expect(userBefore.status).toBe(HttpCode.FORBIDDEN);
        const newConfirmation = await databaseConnection
            .engine()('email_confirmations')
            .select(['confirmationCode'])
            .where({ userId, email })
            .first();
        const newConfirmMail = await agent
            .post(`/register/signup/${userId}/email-confirmation/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode: newConfirmation.confirmationCode });
        expect(newConfirmMail.status).toBe(HttpCode.OK);
        expect(newConfirmMail.status).toBe(HttpCode.OK);
        expect(newConfirmMail.body.data).toStrictEqual({
            confirmationId: expect.any(Number),
        });
        const confirmationAfter = await databaseConnection
            .engine()('email_confirmations')
            .select(['confirmed'])
            .where({ userId, email })
            .first();
        expect(confirmationAfter.confirmed).toBe(true);
        const newConfirmMail2 = await agent
            .post(`/register/signup/${userId}/email-confirmation/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode: newConfirmation.confirmationCode });
        expect(newConfirmMail2.status).toBe(HttpCode.FORBIDDEN);
        expect(newConfirmMail2.body.errors).toStrictEqual([
            {
                errorCode: ErrorCode.USER_ERROR,
                payload: { field: 'userStatus', reason: 'invalid' },
            },
        ]);
        const profileAfter = await agent.get(`/user/${userId}/profile`).set('authorization', authorization);
        expect(profileAfter.status).toBe(HttpCode.OK);
        expect(profileAfter.body.data).toStrictEqual({
            profileId: expect.any(Number),
            email,
            publicName,
            locale: LanguageType.US,
            currencyId: expect.any(Number),
            userId: expect.any(Number),
        });
        const userAfter = await agent.get(`/user/${userId}/`).set('authorization', authorization);
        expect(userAfter.status).toBe(HttpCode.OK);
        expect(userAfter.body.data).toStrictEqual({
            userId: expect.any(Number),
            email,
            status: UserStatus.ACTIVE,
        });
    });
});
