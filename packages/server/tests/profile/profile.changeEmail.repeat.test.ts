/**
 * Tests - Repeated email change
 *
 * POST /user/:userId/profile/email-change         - request change
 * POST /user/:userId/profile/email-change/verify  - confirm with code
 *
 * profile.changeEmail.test.ts covers one change per user. This file covers what happens
 * when the same account changes address more than once: A -> B -> C, and then back to A.
 * Each round is fully confirmed before the next one starts, and every round asserts the
 * three places the address is visible - the `users` row, the profile endpoint, and login.
 *
 * Confirming an email change does not revoke the session (unlike a password change, which
 * blacklists the current token in ProfileController.applyPasswordChange), so the same
 * authorization header is reused across all rounds.
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

const PASSWORD = 'ValidPass1!';

beforeAll(() => {
    server = app.listen(0);
});

afterAll(async () => {
    await closeTestApp(server, userIds);
});

/** One complete round: request the change, read the code from the DB, confirm it. */
async function changeEmail(
    agent: ReturnType<typeof request.agent>,
    userId: number,
    authorization: string,
    newEmail: string,
): Promise<void> {
    await agent
        .post(`/user/${userId}/profile/email-change`)
        .set('authorization', authorization)
        .send({ newEmail })
        .expect(HttpCode.OK);

    const record = await db
        .engine()('email_changing')
        .select('confirmationCode')
        .where({ userId, email: newEmail, confirmed: false })
        .orderBy('id', 'desc')
        .first();

    expect(record).toBeDefined();

    await agent
        .post(`/user/${userId}/profile/email-change/verify`)
        .set('authorization', authorization)
        .send({ confirmationCode: record.confirmationCode, newEmail })
        .expect(HttpCode.NO_CONTENT);
}

/** Asserts the address the account answers with, everywhere it is exposed. */
async function expectCurrentEmail(
    agent: ReturnType<typeof request.agent>,
    userId: number,
    authorization: string,
    email: string,
): Promise<void> {
    const row = await db.engine()('users').select('email').where({ userId }).first();
    expect(row.email).toBe(email);

    const profile = await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);
    expect(profile.body.data.email).toBe(email);

    const user = await agent.get(`/user/${userId}`).set('authorization', authorization).expect(HttpCode.OK);
    expect(user.body.data.email).toBe(email);
}

describe('Repeated email change - A -> B -> C', () => {
    let agent: ReturnType<typeof request.agent>;
    let userId: number;
    let authorization: string;

    const emailA = generateRandomEmail();
    const emailB = generateRandomEmail();
    const emailC = generateRandomEmail();

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent, databaseConnection: db, email: emailA, password: PASSWORD });
        userId = result.userId;
        authorization = result.authorization;
        userIds.push(userId);
    });

    it('starts on the address the account was registered with', async () => {
        await expectCurrentEmail(agent, userId, authorization, emailA);
    });

    it('first change A -> B moves the address and the login', async () => {
        await changeEmail(agent, userId, authorization, emailB);
        await expectCurrentEmail(agent, userId, authorization, emailB);

        const loginNew = await agent.post('/auth/login').send({ email: emailB, password: PASSWORD });
        expect(loginNew.status).toBe(HttpCode.OK);

        await agent.post('/auth/login').send({ email: emailA, password: PASSWORD }).expect(HttpCode.BAD_REQUEST);
    });

    it('second change B -> C works on an account that already changed once', async () => {
        await changeEmail(agent, userId, authorization, emailC);
        await expectCurrentEmail(agent, userId, authorization, emailC);
    });

    it('only the newest address logs in; both previous ones are rejected', async () => {
        const loginC = await agent.post('/auth/login').send({ email: emailC, password: PASSWORD });
        expect(loginC.status).toBe(HttpCode.OK);
        expect(loginC.body.data.token).toEqual(expect.any(String));

        await agent.post('/auth/login').send({ email: emailB, password: PASSWORD }).expect(HttpCode.BAD_REQUEST);
        await agent.post('/auth/login').send({ email: emailA, password: PASSWORD }).expect(HttpCode.BAD_REQUEST);
    });

    it('leaves one confirmed email_changing row per completed change', async () => {
        const rows = await db.engine()('email_changing').select('*').where({ userId }).orderBy('id', 'asc');

        const confirmed = rows.filter((r: { confirmed: boolean }) => r.confirmed);
        expect(confirmed.map((r: { email: string }) => r.email)).toStrictEqual([emailB, emailC]);
    });

    it('changing back to the original address works', async () => {
        await changeEmail(agent, userId, authorization, emailA);
        await expectCurrentEmail(agent, userId, authorization, emailA);

        const loginA = await agent.post('/auth/login').send({ email: emailA, password: PASSWORD });
        expect(loginA.status).toBe(HttpCode.OK);

        await agent.post('/auth/login').send({ email: emailC, password: PASSWORD }).expect(HttpCode.BAD_REQUEST);
    });

    it('the session opened before the first change is still usable after all of them', async () => {
        // No logout happens on email change, so the token handed out at registration
        // survives every round. Asserted explicitly so a future change of that policy
        // shows up here rather than in a user report.
        await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);
    });
});

describe('Repeated email change - rejected addresses', () => {
    it('cannot change to an address another account already uses', async () => {
        const agentOther = request.agent(server);
        const takenEmail = generateRandomEmail();
        const { userId: otherId } = await createUser({
            agent: agentOther,
            databaseConnection: db,
            email: takenEmail,
            password: PASSWORD,
        });
        userIds.push(otherId);

        const agent = request.agent(server);
        const ownEmail = generateRandomEmail();
        const { userId, authorization } = await createUser({
            agent,
            databaseConnection: db,
            email: ownEmail,
            password: PASSWORD,
        });
        userIds.push(userId);

        // EmailChangingService.request looks the address up before writing anything, so the
        // refusal comes at request time and no pending row is created at all.
        await agent
            .post(`/user/${userId}/profile/email-change`)
            .set('authorization', authorization)
            .send({ newEmail: takenEmail })
            .expect(HttpCode.BAD_REQUEST);

        const pending = await db.engine()('email_changing').select('*').where({ userId, email: takenEmail });
        expect(pending).toHaveLength(0);

        const row = await db.engine()('users').select('email').where({ userId }).first();
        expect(row.email).toBe(ownEmail);
    });
});
