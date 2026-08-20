/**
 * Tests - Repeated password change by a logged-in user
 *
 * profile.changePassword.test.ts covers one change per user. This file covers the second
 * round, which is the interesting one: `apply` blacklists the caller's token, so the account
 * has to log in again before it can change its password a second time. The full cycle is
 *
 *     request -> verify code -> apply -> logged out -> log in with the new password -> again
 *
 * and every round asserts that exactly one password is accepted afterwards.
 *
 * The last describe covers the case that motivated the three-step flow: a request the user
 * abandoned must not be able to move the password later. Because nothing about the new
 * password is stored when a request is made, an abandoned row can only ever mail a code - it
 * carries no instruction to set anything.
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

/** One complete round: request with the current password, check the code, then apply. */
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
        .send({ password: currentPassword })
        .expect(HttpCode.OK);

    const confirmationCode = await activeCode(userId);

    await agent
        .post(`/user/${userId}/profile/password-change/verify`)
        .set('authorization', authorization)
        .send({ confirmationCode })
        .expect(HttpCode.OK);

    await agent
        .post(`/user/${userId}/profile/password-change/apply`)
        .set('authorization', authorization)
        .send({ confirmationCode, newPassword })
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

    it('first change P1 -> P2 applies and ends the session that made it', async () => {
        await changePassword(agent, userId, authorization, PASSWORD_1, PASSWORD_2);

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

    it('records both rounds as separate confirmed rows', async () => {
        const rows = await db.engine()('password_changing').select('*').where({ userId }).orderBy('id', 'asc');

        const confirmed = rows.filter((r: { confirmed: boolean }) => r.confirmed);
        expect(confirmed).toHaveLength(2);
        // Nothing about the passwords themselves is kept; only that the change happened.
        expect(confirmed[0]).not.toHaveProperty('passwordHash');
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
            .send({ password: PASSWORD_1 })
            .expect(HttpCode.BAD_REQUEST);

        await agent.post('/auth/login').send({ email, password: PASSWORD_2 }).expect(HttpCode.OK);
        await agent.post('/auth/login').send({ email, password: PASSWORD_3 }).expect(HttpCode.BAD_REQUEST);
    });
});

describe('Abandoned request', () => {
    it('cannot move the password once a newer change completed', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection: db,
            email,
            password: PASSWORD_1,
        });
        userIds.push(userId);

        // Round A: requested, code delivered, then abandoned - the user never applies it.
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', authorization)
            .send({ password: PASSWORD_1 })
            .expect(HttpCode.OK);

        const abandonedCode = await activeCode(userId);

        // Round B: requested and completed. This is the change the user actually made.
        await changePassword(agent, userId, authorization, PASSWORD_1, PASSWORD_2);
        const secondAuth = await login(agent, email, PASSWORD_2);

        // Round B re-coded the same row, so round A's code is no longer anything.
        await agent
            .post(`/user/${userId}/profile/password-change/verify`)
            .set('authorization', secondAuth)
            .send({ confirmationCode: abandonedCode })
            .expect(HttpCode.BAD_REQUEST);

        await agent
            .post(`/user/${userId}/profile/password-change/apply`)
            .set('authorization', secondAuth)
            .send({ confirmationCode: abandonedCode, newPassword: PASSWORD_3 })
            .expect(HttpCode.BAD_REQUEST);

        // The password the user set stands, and round A's target never becomes valid.
        await agent.post('/auth/login').send({ email, password: PASSWORD_2 }).expect(HttpCode.OK);
        await agent.post('/auth/login').send({ email, password: PASSWORD_3 }).expect(HttpCode.BAD_REQUEST);
    });

    it('an unfinished request left behind after a change grants nothing on its own', async () => {
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

        // A pending row exists again, and is then left alone.
        await agent
            .post(`/user/${userId}/profile/password-change`)
            .set('authorization', secondAuth)
            .send({ password: PASSWORD_2 })
            .expect(HttpCode.OK);

        const pending = await db.engine()('password_changing').select('*').where({ userId, confirmed: false }).first();
        expect(pending).toBeDefined();

        // Nothing in it says which password to set, so nothing happens until someone supplies
        // both the code and a password on `apply`.
        await agent.post('/auth/login').send({ email, password: PASSWORD_2 }).expect(HttpCode.OK);
        await agent.post('/auth/login').send({ email, password: PASSWORD_3 }).expect(HttpCode.BAD_REQUEST);
    });
});
