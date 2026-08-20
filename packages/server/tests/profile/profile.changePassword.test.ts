/**
 * Tests - Profile Password Change
 *
 * POST /user/:userId/profile/password-change         - prove the current password, mail a code
 * POST /user/:userId/profile/password-change/verify  - is this code right? changes nothing
 * POST /user/:userId/profile/password-change/apply   - the code again, plus the new password
 * POST /user/:userId/profile/password-change/resend  - new code for the pending request
 *
 * The new password is only ever sent to `apply`, and is never stored: `password_changing`
 * holds a code and an expiry, nothing else. A pending row is therefore a proof that the
 * mailbox was reached, not an instruction to set some particular password.
 */

import { closeTestApp, createUser, createUserNotVerify, generateSecureRandom, generateRandomEmail } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode } from '@tenpercent/shared';

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

/** The code of the user's active (unconfirmed) request. */
async function activeCode(userId: number): Promise<number> {
    const record = await db
        .engine()('password_changing')
        .select('confirmationCode')
        .where({ userId, confirmed: false })
        .orderBy('id', 'desc')
        .first();
    expect(record).toBeDefined();
    return record.confirmationCode;
}

describe('POST /user/:userId/profile/password-change - request a code', () => {
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
            .send({ password: OLD_PASSWORD });

        expect(status).toBe(HttpCode.OK);
        expect(body.data).toStrictEqual({
            expiresAt: expect.any(String),
        });
    });

    it('200 - pending record holds a code and no password material', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ password: OLD_PASSWORD })
            .expect(HttpCode.OK);

        const record = await db.engine()('password_changing').select('*').where({ userId }).orderBy('id', 'desc').first();

        expect(record).toBeDefined();
        expect(record.userId).toBe(userId);
        expect(record.confirmed).toBe(false);
        expect(record.confirmationCode).toEqual(expect.any(Number));
        expect(record.confirmationCode.toString()).toHaveLength(8);
        // The columns that used to carry the pending password are gone from the schema.
        expect(record).not.toHaveProperty('passwordHash');
        expect(record).not.toHaveProperty('salt');
    });

    it('200 - a repeated request re-codes the same row instead of adding a second', async () => {
        const before = await db.engine()('password_changing').select('*').where({ userId, confirmed: false });
        expect(before).toHaveLength(1);

        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ password: OLD_PASSWORD })
            .expect(HttpCode.OK);

        const after = await db.engine()('password_changing').select('*').where({ userId, confirmed: false });
        expect(after).toHaveLength(1);
        expect(after[0].id).toBe(before[0].id);
        expect(after[0].confirmationCode).not.toBe(before[0].confirmationCode);
    });

    it('400 - the request carries no newPassword field', async () => {
        // The new password belongs to `apply` alone; offering it here is a malformed request.
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ password: OLD_PASSWORD, newPassword: NEW_PASSWORD })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - wrong current password is rejected', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ password: 'WrongPass9!' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('403 - unverified user cannot request password change', async () => {
        const unverifiedAgent = request.agent(server);
        const { userId: unverifiedId, authorization: unverifiedAuth } = await createUserNotVerify({
            agent: unverifiedAgent,
            password: OLD_PASSWORD,
        });
        userIds.push(unverifiedId);

        await unverifiedAgent
            .post(`/user/${unverifiedId}/profile/password-change`)
            .set('authorization', unverifiedAuth)
            .send({ password: OLD_PASSWORD })
            .expect(HttpCode.FORBIDDEN);
    });

    it('401 - unauthorized request is rejected', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .send({ password: OLD_PASSWORD })
            .expect(HttpCode.UNAUTHORIZED);
    });
});

describe('POST /user/:userId/profile/password-change/verify - check the code', () => {
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
            .send({ password: OLD_PASSWORD })
            .expect(HttpCode.OK);

        confirmationCode = await activeCode(userId);
    });

    it('200 - correct code is accepted', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode })
            .expect(HttpCode.OK);
    });

    it('- the check spends nothing: the row is untouched and the code still works', async () => {
        const record = await db
            .engine()('password_changing')
            .select('confirmed', 'confirmationCode')
            .where({ userId })
            .orderBy('id', 'desc')
            .first();

        expect(record.confirmed).toBe(false);
        expect(record.confirmationCode).toBe(confirmationCode);

        await agent
            .post(`/user/${userId}/profile/password-change/verify`)
            .set('authorization', authorization)
            .send({ confirmationCode })
            .expect(HttpCode.OK);
    });

    it('- the session survives the check', async () => {
        // Only `apply` ends sessions. Logging the user out here would leave them unable to
        // send the password on the next step.
        await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);
    });

    it('400 - wrong confirmationCode is rejected', async () => {
        const wrongCode = confirmationCode === 12345678 ? 12345679 : 12345678;

        await agent
            .post(`/user/${userId}/profile/password-change/verify`)
            .set('authorization', authorization)
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

describe('POST /user/:userId/profile/password-change/apply - set the password', () => {
    let agent: ReturnType<typeof request.agent>;
    let userId: number;
    let authorization: string;
    let email: string;
    let confirmationCode: number;

    beforeAll(async () => {
        agent = request.agent(server);
        email = generateRandomEmail();
        const result = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userId = result.userId;
        authorization = result.authorization;
        userIds.push(userId);

        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ password: OLD_PASSWORD })
            .expect(HttpCode.OK);

        confirmationCode = await activeCode(userId);
    });

    it('400 - a password identical to the current one is refused', async () => {
        const { body, status } = await agent
            .post(`/user/${userId}/profile/password-change/apply`)
            .set('authorization', authorization)
            .send({ confirmationCode, newPassword: OLD_PASSWORD });

        expect(status).toBe(HttpCode.BAD_REQUEST);
        expect(body.errors[0].payload).toStrictEqual({
            field: 'newPassword',
            reason: 'validation:passwordSameAsCurrent',
        });
    });

    it('400 - an invalid password is refused even with a correct code', async () => {
        // Whatever the client validated before showing the field does not count.
        await agent
            .post(`/user/${userId}/profile/password-change/apply`)
            .set('authorization', authorization)
            .send({ confirmationCode, newPassword: 'Ab1!' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - a wrong code is refused, and the password does not move', async () => {
        const wrongCode = confirmationCode === 12345678 ? 12345679 : 12345678;

        await agent
            .post(`/user/${userId}/profile/password-change/apply`)
            .set('authorization', authorization)
            .send({ confirmationCode: wrongCode, newPassword: NEW_PASSWORD })
            .expect(HttpCode.BAD_REQUEST);

        await agent.post('/auth/login').send({ email, password: OLD_PASSWORD }).expect(HttpCode.OK);
    });

    it('204 - correct code plus a valid password changes it', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change/apply`)
            .set('authorization', authorization)
            .send({ confirmationCode, newPassword: NEW_PASSWORD })
            .expect(HttpCode.NO_CONTENT);
    });

    it('- the row is marked confirmed and the session is dropped', async () => {
        const record = await db.engine()('password_changing').select('confirmed').where({ userId }).orderBy('id', 'desc').first();
        expect(record.confirmed).toBe(true);

        await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.UNAUTHORIZED);
    });

    it('- the new password logs in and the old one does not', async () => {
        await agent.post('/auth/login').send({ email, password: NEW_PASSWORD }).expect(HttpCode.OK);
        await agent.post('/auth/login').send({ email, password: OLD_PASSWORD }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - the spent code cannot be replayed', async () => {
        const freshAgent = request.agent(server);
        const login = await freshAgent.post('/auth/login').send({ email, password: NEW_PASSWORD }).expect(HttpCode.OK);

        await freshAgent
            .post(`/user/${userId}/profile/password-change/apply`)
            .set('authorization', login.header['authorization'])
            .send({ confirmationCode, newPassword: 'YetAnother4$' })
            .expect(HttpCode.BAD_REQUEST);

        await freshAgent.post('/auth/login').send({ email, password: NEW_PASSWORD }).expect(HttpCode.OK);
    });

    it('401 - unauthorized request is rejected', async () => {
        await agent
            .post(`/user/${userId}/profile/password-change/apply`)
            .send({ confirmationCode, newPassword: NEW_PASSWORD })
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
            .send({ password: OLD_PASSWORD })
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

        expect(after.confirmationCode.toString()).toHaveLength(8);
        expect(new Date(after.expiresAt).getTime()).toBeGreaterThan(Date.now());
        expect(after.confirmationCode).not.toBe(before.confirmationCode);
    });

    it('- the resent code is the one that applies the change', async () => {
        const code = await activeCode(userId);

        await agent
            .post(`/user/${userId}/profile/password-change/apply`)
            .set('authorization', authorization)
            .send({ confirmationCode: code, newPassword: NEW_PASSWORD })
            .expect(HttpCode.NO_CONTENT);
    });

    it('400 - resend with non-existent confirmationId returns error', async () => {
        const agent4 = request.agent(server);
        const { userId: userId4, authorization: auth4 } = await createUser({
            agent: agent4,
            databaseConnection: db,
            password: OLD_PASSWORD,
        });
        userIds.push(userId4);

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
