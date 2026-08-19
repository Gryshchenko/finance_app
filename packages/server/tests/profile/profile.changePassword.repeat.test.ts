/**
 * Tests - Repeated password change by a logged-in user
 *
 * POST /user/:userId/profile/password-change         - request change
 * POST /user/:userId/profile/password-change/verify  - confirm with code
 *
 * profile.changePassword.test.ts covers one change per user. This file covers the second
 * round, which is the interesting one: confirming a change blacklists the caller's token
 * (ProfileController.confirmPasswordChange calls authService.logout), so the account has
 * to log in again before it can change its password a second time. The full cycle is
 *
 *     change -> confirm -> logged out -> log in with the new password -> change again
 *
 * and every round asserts that exactly one password is accepted afterwards.
 *
 * The last describe - "Superseded pending request" - FAILS ON PURPOSE: it describes what
 * should happen to a request the user abandoned, and that part of the flow is broken today.
 */

import { closeTestApp, createUser, generateRandomEmail } from '../TestsUtils.';
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

const PASSWORD_1 = 'ValidPass1!';
const PASSWORD_2 = 'NewSecure2@';
const PASSWORD_3 = 'ThirdPass3#';

beforeAll(() => {
    server = app.listen(0);
});

afterAll(async () => {
    await closeTestApp(server, userIds);
});

/** One complete round: request with the current password, read the code, confirm it. */
async function changePassword(
    agent: ReturnType<typeof request.agent>,
    userId: number,
    authorization: string,
    currentPassword: string,
    newPassword: string,
): Promise<void> {
    await agent
        .post(`/user/${userId}/profile/password-change`)
        .set('authorization', authorization)
        .send({ password: currentPassword, newPassword })
        .expect(HttpCode.OK);

    const record = await db
        .engine()('password_changing')
        .select('confirmationCode')
        .where({ userId, confirmed: false })
        .orderBy('id', 'desc')
        .first();

    expect(record).toBeDefined();

    await agent
        .post(`/user/${userId}/profile/password-change/verify`)
        .set('authorization', authorization)
        .send({ confirmationCode: record.confirmationCode })
        .expect(HttpCode.NO_CONTENT);
}

/** Logs in and returns the authorization header for the new session. */
async function login(agent: ReturnType<typeof request.agent>, email: string, password: string): Promise<string> {
    const res = await agent.post('/auth/login').send({ email, password });
    expect(res.status).toBe(HttpCode.OK);
    expect(res.header['authorization']).toEqual(expect.any(String));
    return res.header['authorization'];
}

describe('Repeated password change - P1 -> P2 -> P3', () => {
    let agent: ReturnType<typeof request.agent>;
    let userId: number;
    let authorization: string;
    const email = generateRandomEmail();

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent, databaseConnection: db, email, password: PASSWORD_1 });
        userId = result.userId;
        authorization = result.authorization;
        userIds.push(userId);
    });

    it('first change P1 -> P2 confirms and ends the session that made it', async () => {
        await changePassword(agent, userId, authorization, PASSWORD_1, PASSWORD_2);

        // The token used to confirm is blacklisted, so it no longer opens anything.
        await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.UNAUTHORIZED);
    });

    it('only P2 logs in after the first change', async () => {
        await agent.post('/auth/login').send({ email, password: PASSWORD_1 }).expect(HttpCode.BAD_REQUEST);
        authorization = await login(agent, email, PASSWORD_2);

        await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);
    });

    it('second change P2 -> P3 works on the freshly logged-in session', async () => {
        await changePassword(agent, userId, authorization, PASSWORD_2, PASSWORD_3);

        await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.UNAUTHORIZED);
    });

    it('only P3 logs in after the second change; neither earlier password does', async () => {
        await agent.post('/auth/login').send({ email, password: PASSWORD_1 }).expect(HttpCode.BAD_REQUEST);
        await agent.post('/auth/login').send({ email, password: PASSWORD_2 }).expect(HttpCode.BAD_REQUEST);

        authorization = await login(agent, email, PASSWORD_3);
        await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);
    });

    it('records both rounds as separate confirmed rows with distinct hashes', async () => {
        const rows = await db.engine()('password_changing').select('*').where({ userId }).orderBy('id', 'asc');

        const confirmed = rows.filter((r: { confirmed: boolean }) => r.confirmed);
        expect(confirmed).toHaveLength(2);

        // password_changing carries UNIQUE ("userId", "passwordHash"). The salt is drawn per
        // request, so two rounds cannot collide on it - this asserts that assumption rather
        // than leaving it implicit.
        const [first, second] = confirmed;
        expect(first.passwordHash).not.toBe(second.passwordHash);
        expect(first.salt).not.toBe(second.salt);
    });
});

describe('Repeated password change - wrong current password on the second round', () => {
    it('rejects a second change that presents the password replaced by the first', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection: db,
            email,
            password: PASSWORD_1,
        });
        userIds.push(userId);

        await changePassword(agent, userId, authorization, PASSWORD_1, PASSWORD_2);
        const secondAuth = await login(agent, email, PASSWORD_2);

        // PASSWORD_1 is no longer the current password, so it cannot authorise a change.
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', secondAuth)
            .send({ password: PASSWORD_1, newPassword: PASSWORD_3 })
            .expect(HttpCode.BAD_REQUEST);

        await agent.post('/auth/login').send({ email, password: PASSWORD_2 }).expect(HttpCode.OK);
        await agent.post('/auth/login').send({ email, password: PASSWORD_3 }).expect(HttpCode.BAD_REQUEST);
    });
});

describe('Superseded pending request', () => {
    // FAILS ON PURPOSE. A request the user abandoned stays confirmable for its full
    // 10-minute window (CHANGE_CODE_EXPIRES_IN in PasswordChangingService), even after a
    // later request has been completed: PasswordChangingService.confirm picks the newest
    // unconfirmed, unexpired row and applies whatever password that row was created with.
    // The abandoned code therefore rolls the account onto a third password minutes after
    // the user believes they finished changing it, and locks them out of the one they set.

    it('an abandoned request cannot be confirmed once a newer change completed', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection: db,
            email,
            password: PASSWORD_1,
        });
        userIds.push(userId);

        // Round A: requested, code delivered, then abandoned - the user never confirms it.
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ password: PASSWORD_1, newPassword: PASSWORD_3 })
            .expect(HttpCode.OK);

        const abandoned = await db
            .engine()('password_changing')
            .select('id', 'confirmationCode')
            .where({ userId, confirmed: false })
            .orderBy('id', 'desc')
            .first();

        // Round B: requested and completed. This is the change the user actually made.
        await changePassword(agent, userId, authorization, PASSWORD_1, PASSWORD_2);
        const secondAuth = await login(agent, email, PASSWORD_2);

        await agent
            .post(`/user/${userId}/profile/password-change/verify`)
            .set('authorization', secondAuth)
            .send({ confirmationCode: abandoned.confirmationCode })
            .expect(HttpCode.BAD_REQUEST);

        // The password the user set stands, and round A's target never becomes valid.
        await agent.post('/auth/login').send({ email, password: PASSWORD_2 }).expect(HttpCode.OK);
        await agent.post('/auth/login').send({ email, password: PASSWORD_3 }).expect(HttpCode.BAD_REQUEST);
    });
});
