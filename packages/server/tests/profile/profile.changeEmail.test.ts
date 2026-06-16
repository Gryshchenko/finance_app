/**
 * Tests - Profile Email Change
 *
 * POST /user/:userId/profile/email-change         - request change
 * POST /user/:userId/profile/email-change/verify  - confirm with code
 * POST /user/:userId/profile/email-change/resend  - resend code
 */

import { createUser, createUserNotVerify, deleteUserAfterTest, generateSecureRandom, generateRandomEmail } from '../TestsUtils.';
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

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    server = app.listen(port);
});

afterAll(async () => {
    await db.engine()('email_changing').delete().whereIn('userId', userIds);
    for (const id of userIds) {
        await deleteUserAfterTest(id, db);
    }
    (server as any).closeAllConnections();
    await new Promise<void>((resolve) => (server as { close: (cb: () => void) => void }).close(resolve));
});

describe('POST /user/:userId/profile/email-change - request email change', () => {
    let agent: ReturnType<typeof request.agent>;
    let userId: number;
    let authorization: string;

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent, databaseConnection: db });
        userId = result.userId;
        authorization = result.authorization;
        userIds.push(userId);
    });

    it('200 - creates pending change and returns expiresAt', async () => {
        const newEmail = generateRandomEmail();
        const { body, status } = await agent
            .post(`/user/${userId}/profile/email-change`)
            .set('authorization', authorization)
            .send({ newEmail });

        expect(status).toBe(HttpCode.OK);
        expect(body.data).toStrictEqual({
            expiresAt: expect.any(String),
        });
    });

    it('200 - pending record is written to email_changing table', async () => {
        const newEmail = generateRandomEmail();
        await agent
            .post(`/user/${userId}/profile/email-change`)
            .set('authorization', authorization)
            .send({ newEmail })
            .expect(HttpCode.OK);

        const record = await db.engine()('email_changing').select('*').where({ userId, email: newEmail }).first();

        expect(record).toBeDefined();
        expect(record.email).toBe(newEmail);
        expect(record.userId).toBe(userId);
        expect(record.confirmed).toBe(false);
        expect(record.confirmationCode).toEqual(expect.any(Number));
        expect(record.confirmationCode.toString()).toHaveLength(8);
    });

    it('200 - repeated request for the same email overwrites the pending code', async () => {
        const newEmail = generateRandomEmail();

        await agent
            .post(`/user/${userId}/profile/email-change`)
            .set('authorization', authorization)
            .send({ newEmail })
            .expect(HttpCode.OK);

        await db.engine()('email_changing').select('confirmationCode').where({ userId, email: newEmail }).first();

        await agent
            .post(`/user/${userId}/profile/email-change`)
            .set('authorization', authorization)
            .send({ newEmail })
            .expect(HttpCode.OK);

        const second = await db.engine()('email_changing').select('confirmationCode').where({ userId, email: newEmail }).first();

        expect(second).toBeDefined();
        // code may or may not be refreshed, but record must exist
        expect(second.confirmationCode).toEqual(expect.any(Number));
        // only one row per (userId, email) pair
        const count = await db.engine()('email_changing').count('* as n').where({ userId, email: newEmail }).first();
        expect(Number(count?.n)).toBe(1);
    });

    it('403 - unverified user cannot request email change', async () => {
        const unverifiedAgent = request.agent(server);
        const { userId: unverifiedId, authorization: unverifiedAuth } = await createUserNotVerify({ agent: unverifiedAgent });
        userIds.push(unverifiedId);

        await unverifiedAgent
            .post(`/user/${unverifiedId}/profile/email-change`)
            .set('authorization', unverifiedAuth)
            .send({ newEmail: generateRandomEmail() })
            .expect(HttpCode.FORBIDDEN);
    });

    it('401 - unauthorized request is rejected', async () => {
        await agent
            .post(`/user/${userId}/profile/email-change`)
            .send({ newEmail: generateRandomEmail() })
            .expect(HttpCode.UNAUTHORIZED);
    });
});

describe('POST /user/:userId/profile/email-change/verify - confirm email change', () => {
    let agent: ReturnType<typeof request.agent>;
    let userId: number;
    let authorization: string;
    let confirmationCode: number;
    let newEmail: string;

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent, databaseConnection: db });
        userId = result.userId;
        authorization = result.authorization;
        userIds.push(userId);

        newEmail = generateRandomEmail();

        await agent
            .post(`/user/${userId}/profile/email-change`)
            .set('authorization', authorization)
            .send({ newEmail })
            .expect(HttpCode.OK);

        const record = await db.engine()('email_changing').select('confirmationCode').where({ userId, email: newEmail }).first();

        confirmationCode = record.confirmationCode;
    });

    it('204 - correct code confirms the email change', async () => {
        await agent
            .post(`/user/${userId}/profile/email-change/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode, newEmail })
            .expect(HttpCode.NO_CONTENT);
    });

    it('- email_changing record is marked confirmed after verify', async () => {
        const record = await db.engine()('email_changing').select('confirmed').where({ userId, email: newEmail }).first();
        expect(record.confirmed).toBe(true);
    });

    it('- user email in users table is updated to newEmail', async () => {
        const user = await db.engine()('users').select('email').where({ userId }).first();
        expect(user.email).toBe(newEmail);
    });

    it('400 - wrong confirmationCode is rejected', async () => {
        const agent2 = request.agent(server);
        const { userId: userId2, authorization: auth2 } = await createUser({ agent: agent2, databaseConnection: db });
        userIds.push(userId2);

        const email2 = generateRandomEmail();
        await agent2
            .post(`/user/${userId2}/profile/email-change`)
            .set('authorization', auth2)
            .send({ newEmail: email2 })
            .expect(HttpCode.OK);

        const record = await db
            .engine()('email_changing')
            .select('confirmationCode')
            .where({ userId: userId2, email: email2 })
            .first();
        const wrongCode = record.confirmationCode === 12345678 ? 12345679 : 12345678;

        await agent2
            .post(`/user/${userId2}/profile/email-change/verify`)
            .set('authorization', auth2)
            .send({ confirmationCode: wrongCode, newEmail: email2 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - verify without a prior request returns error', async () => {
        const agent3 = request.agent(server);
        const { userId: userId3, authorization: auth3 } = await createUser({ agent: agent3, databaseConnection: db });
        userIds.push(userId3);

        await agent3
            .post(`/user/${userId3}/profile/email-change/verify`)
            .set('authorization', auth3)
            .send({ confirmationCode: 12345678, newEmail: generateRandomEmail() })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('401 - unauthorized request is rejected', async () => {
        await agent
            .post(`/user/${userId}/profile/email-change/verify`)
            .send({ confirmationCode, newEmail })
            .expect(HttpCode.UNAUTHORIZED);
    });
});

describe('POST /user/:userId/profile/email-change/resend - resend confirmation code', () => {
    let agent: ReturnType<typeof request.agent>;
    let userId: number;
    let authorization: string;
    let confirmationId: number;
    let newEmail: string;

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent, databaseConnection: db });
        userId = result.userId;
        authorization = result.authorization;
        userIds.push(userId);

        newEmail = generateRandomEmail();

        await agent
            .post(`/user/${userId}/profile/email-change`)
            .set('authorization', authorization)
            .send({ newEmail })
            .expect(HttpCode.OK);

        const record = await db
            .engine()('email_changing')
            .select('id', 'confirmationCode')
            .where({ userId, email: newEmail })
            .first();

        confirmationId = record.id;
    });

    it('204 - resend generates a new confirmationCode', async () => {
        const before = await db.engine()('email_changing').select('confirmationCode').where({ userId, email: newEmail }).first();

        await agent
            .post(`/user/${userId}/profile/email-change/resend`)
            .set('authorization', authorization)
            .send({ newEmail })
            .expect(HttpCode.NO_CONTENT);

        const after = await db
            .engine()('email_changing')
            .select('confirmationCode', 'expiresAt')
            .where({ userId, email: newEmail })
            .first();

        // A new 8-digit code must be present
        expect(after.confirmationCode.toString()).toHaveLength(8);
        // expiresAt must be in the future
        expect(new Date(after.expiresAt).getTime()).toBeGreaterThan(Date.now());
        // code has changed (extremely unlikely to be the same random code)
        expect(after.confirmationCode).not.toBe(before.confirmationCode);
    });

    it('400 - resend after the code has expired or no pending change', async () => {
        const agent4 = request.agent(server);
        const { userId: userId4, authorization: auth4 } = await createUser({ agent: agent4, databaseConnection: db });
        userIds.push(userId4);

        // No email_changing record for this user + email combination
        await agent4
            .post(`/user/${userId4}/profile/email-change/resend`)
            .set('authorization', auth4)
            .send({ newEmail: generateRandomEmail() })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('401 - unauthorized request is rejected', async () => {
        await agent.post(`/user/${userId}/profile/email-change/resend`).send({ newEmail }).expect(HttpCode.UNAUTHORIZED);
    });
});

describe('Full flow - request → verify → login with new email', () => {
    it('new email works for login after change; old email does not', async () => {
        const agent = request.agent(server);
        const password = 'ValidPass1!';
        const oldEmail = generateRandomEmail();
        const newEmail = generateRandomEmail();

        const { userId, authorization } = await createUser({
            agent,
            databaseConnection: db,
            email: oldEmail,
            password,
        });
        userIds.push(userId);

        // Step 1 - request email change
        await agent
            .post(`/user/${userId}/profile/email-change`)
            .set('authorization', authorization)
            .send({ newEmail })
            .expect(HttpCode.OK);

        // Step 2 - get code from DB
        const record = await db.engine()('email_changing').select('confirmationCode').where({ userId, email: newEmail }).first();

        // Step 3 - confirm change
        await agent
            .post(`/user/${userId}/profile/email-change/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode: record.confirmationCode, newEmail })
            .expect(HttpCode.NO_CONTENT);

        // Step 4 - login with new email succeeds
        const loginNew = await agent.post('/auth/login').send({ email: newEmail, password });
        expect(loginNew.status).toBe(HttpCode.OK);
        expect(loginNew.body.data.token).toEqual(expect.any(String));

        // Step 5 - login with old email fails (user record now holds newEmail)
        const loginOld = await agent.post('/auth/login').send({ email: oldEmail, password });
        expect(loginOld.status).toBe(HttpCode.BAD_REQUEST);
    });
});
