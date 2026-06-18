import {
    closeTestApp,
    createUser,
    createUserNotVerify,
    deleteUserAfterTest,
    generateSecureRandom,
    generateRandomEmail,
} from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode } from 'tenpercent/shared';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

let server: unknown;
const userIds: number[] = [];
const db = DatabaseConnection.instance(config);

const OLD_PASSWORD = 'ValidPass1!';
const NEW_PASSWORD = 'NewSecure2@';

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    server = app.listen(port);
});

afterAll(async () => {
    await closeTestApp(server, userIds);
});

describe('POST /user/:userId/profile/password-change - request password change', () => {
    let agent: ReturnType<typeof request.agent>;
    let userId: number;
    let authorization: string;

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent, databaseConnection: db, password: OLD_PASSWORD });
        userId = result.userId;
        authorization = result.authorization;
        userIds.push(userId);
    });

    it('200 - creates pending change and returns expiresAt', async () => {
        const { body, status } = await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ newPassword: NEW_PASSWORD, password: OLD_PASSWORD });

        expect(status).toBe(HttpCode.OK);
        expect(body.data).toStrictEqual({
            expiresAt: expect.any(String),
        });
    });

    it('200 - pending record is written to password_changing table', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ newPassword: NEW_PASSWORD, password: OLD_PASSWORD })
            .expect(HttpCode.OK);

        const record = await db.engine()('password_changing').select('*').where({ userId }).orderBy('id', 'desc').first();

        expect(record).toBeDefined();
        expect(record.userId).toBe(userId);
        expect(record.confirmed).toBe(false);
        expect(record.confirmationCode).toEqual(expect.any(Number));
        expect(record.confirmationCode.toString()).toHaveLength(8);
        expect(record.passwordHash).toEqual(expect.any(String));
        expect(record.salt).toEqual(expect.any(String));
    });

    it('400 - wrong current password is rejected', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ newPassword: NEW_PASSWORD, password: 'WrongPass9!' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('403 - unverified user cannot request password change', async () => {
        const unverifiedAgent = request.agent(server);
        const { userId: unverifiedId, authorization: unverifiedAuth } = await createUserNotVerify({ agent: unverifiedAgent });
        userIds.push(unverifiedId);

        await unverifiedAgent
            .post(`/user/${unverifiedId}/profile/password-change`)
            .set('authorization', unverifiedAuth)
            .send({ newPassword: NEW_PASSWORD, password: OLD_PASSWORD })
            .expect(HttpCode.FORBIDDEN);
    });

    it('401 - unauthorized request is rejected', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .send({ newPassword: NEW_PASSWORD, password: OLD_PASSWORD })
            .expect(HttpCode.UNAUTHORIZED);
    });
});

describe('POST /user/:userId/profile/password-change/verify - confirm password change', () => {
    let agent: ReturnType<typeof request.agent>;
    let userId: number;
    let authorization: string;
    let confirmationCode: number;

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent, databaseConnection: db, password: OLD_PASSWORD });
        userId = result.userId;
        authorization = result.authorization;
        userIds.push(userId);

        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ newPassword: NEW_PASSWORD, password: OLD_PASSWORD })
            .expect(HttpCode.OK);

        const record = await db
            .engine()('password_changing')
            .select('confirmationCode')
            .where({ userId })
            .orderBy('id', 'desc')
            .first();
        confirmationCode = record.confirmationCode;
    });

    it('204 - correct code confirms the password change', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode })
            .expect(HttpCode.NO_CONTENT);
    });

    it('- password_changing record is marked confirmed after verify', async () => {
        const record = await db.engine()('password_changing').select('confirmed').where({ userId }).orderBy('id', 'desc').first();
        expect(record.confirmed).toBe(true);
    });

    it('- old token is invalidated after verify', async () => {
        // The verify endpoint calls logout() which blacklists the current token
        const { status } = await agent.get(`/user/${userId}/profile`).set('authorization', authorization);

        expect(status).toBe(HttpCode.UNAUTHORIZED);
    });

    it('400 - wrong confirmationCode is rejected', async () => {
        const agent2 = request.agent(server);
        const { userId: userId2, authorization: auth2 } = await createUser({
            agent: agent2,
            databaseConnection: db,
            password: OLD_PASSWORD,
        });
        userIds.push(userId2);

        await agent2
            .post(`/user/${userId2}/profile/password-change`)
            .set('authorization', auth2)
            .send({ newPassword: NEW_PASSWORD, password: OLD_PASSWORD })
            .expect(HttpCode.OK);

        const record = await db
            .engine()('password_changing')
            .select('confirmationCode')
            .where({ userId: userId2 })
            .orderBy('id', 'desc')
            .first();
        const wrongCode = record.confirmationCode === 12345678 ? 12345679 : 12345678;

        await agent2
            .post(`/user/${userId2}/profile/password-change/verify`)
            .set('authorization', auth2)
            .send({ confirmationCode: wrongCode })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - verify without a prior request returns error', async () => {
        const agent3 = request.agent(server);
        const { userId: userId3, authorization: auth3 } = await createUser({
            agent: agent3,
            databaseConnection: db,
            password: OLD_PASSWORD,
        });
        userIds.push(userId3);

        await agent3
            .post(`/user/${userId3}/profile/password-change/verify`)
            .set('authorization', auth3)
            .send({ confirmationCode: 12345678 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('401 - unauthorized request is rejected', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change/verify`)
            .send({ confirmationCode })
            .expect(HttpCode.UNAUTHORIZED);
    });
});

describe('POST /user/:userId/profile/password-change/resend - resend confirmation code', () => {
    let agent: ReturnType<typeof request.agent>;
    let userId: number;
    let authorization: string;
    let confirmationId: number;

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent, databaseConnection: db, password: OLD_PASSWORD });
        userId = result.userId;
        authorization = result.authorization;
        userIds.push(userId);

        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ newPassword: NEW_PASSWORD, password: OLD_PASSWORD })
            .expect(HttpCode.OK);

        const record = await db.engine()('password_changing').select('id').where({ userId }).orderBy('id', 'desc').first();
        confirmationId = record.id;
    });

    it('204 - resend generates a new confirmationCode', async () => {
        const before = await db
            .engine()('password_changing')
            .select('confirmationCode')
            .where({ userId })
            .orderBy('id', 'desc')
            .first();

        await agent
            .post(`/user/${userId}/profile/password-change/resend`)
            .set('authorization', authorization)
            .send({ confirmationId })
            .expect(HttpCode.NO_CONTENT);

        const after = await db
            .engine()('password_changing')
            .select('confirmationCode', 'expiresAt')
            .where({ userId })
            .orderBy('id', 'desc')
            .first();

        // A new 8-digit code must be present
        expect(after.confirmationCode.toString()).toHaveLength(8);
        // expiresAt must be in the future
        expect(new Date(after.expiresAt).getTime()).toBeGreaterThan(Date.now());
        // code has changed (extremely unlikely to be the same random code)
        expect(after.confirmationCode).not.toBe(before.confirmationCode);
    });

    it('400 - resend with non-existent confirmationId returns error', async () => {
        const agent4 = request.agent(server);
        const { userId: userId4, authorization: auth4 } = await createUser({
            agent: agent4,
            databaseConnection: db,
            password: OLD_PASSWORD,
        });
        userIds.push(userId4);

        // No password_changing record for this user
        await agent4
            .post(`/user/${userId4}/profile/password-change/resend`)
            .set('authorization', auth4)
            .send({ confirmationId: 9999999 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('401 - unauthorized request is rejected', async () => {
        await agent.post(`/user/${userId}/profile/password-change/resend`).send({ confirmationId }).expect(HttpCode.UNAUTHORIZED);
    });
});

describe('Full flow - request → verify → login with new password', () => {
    it('new password works for login after change; old password does not', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();

        const { userId, authorization } = await createUser({
            agent,
            databaseConnection: db,
            email,
            password: OLD_PASSWORD,
        });
        userIds.push(userId);

        // Step 1 - request password change
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ newPassword: NEW_PASSWORD, password: OLD_PASSWORD })
            .expect(HttpCode.OK);

        // Step 2 - get code from DB
        const record = await db
            .engine()('password_changing')
            .select('confirmationCode')
            .where({ userId })
            .orderBy('id', 'desc')
            .first();

        // Step 3 - confirm change (this also blacklists the current token)
        await agent
            .post(`/user/${userId}/profile/password-change/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode: record.confirmationCode })
            .expect(HttpCode.NO_CONTENT);

        // Step 4 - logout after success
        await agent
            .post(`/user/${userId}/profile/password-change/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode: record.confirmationCode })
            .expect(HttpCode.UNAUTHORIZED);

        // Step 5 - login with new password succeeds
        const loginNew = await agent.post('/auth/login').send({ email, password: NEW_PASSWORD });
        expect(loginNew.status).toBe(HttpCode.OK);
        expect(loginNew.body.data.token).toEqual(expect.any(String));

        // Step 6 - login with old password fails
        const loginOld = await agent.post('/auth/login').send({ email, password: OLD_PASSWORD });
        expect(loginOld.status).toBe(HttpCode.BAD_REQUEST);
    });
});
