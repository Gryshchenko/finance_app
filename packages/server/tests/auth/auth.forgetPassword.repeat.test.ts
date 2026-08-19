/**
 * Tests - Repeated password reset requests (POST /auth/forget)
 *
 * THESE TESTS FAIL ON PURPOSE. They describe the flow as it should work; the flow is
 * currently broken, so they are red. Nothing here is a workaround for that - when the
 * defect is fixed they turn green with no edit.
 *
 * The defect: `password_forgot` carries `UNIQUE ("userId", email)`, but
 * ForgotPasswordDataAccess.create() only ever INSERTs and no delete path exists for the
 * table. Every reset request after the first for the same address violates the constraint.
 * AuthController.forget swallows the exception and still answers 204, so nothing in the
 * response distinguishes a stored request from a discarded one - which is why the existing
 * case in auth.changePassword.test.ts, "can be called multiple times for the same email
 * (upsert)", stays green while asserting only the status code. The tests below read
 * `password_forgot` and drive the whole flow instead.
 *
 * Two symptoms, both covered here:
 *   - a user who loses the first mail and asks again never receives a second code;
 *   - a user who has completed one reset can never reset again, because the row is left
 *     `confirmed = true` and no replacement can be inserted.
 *
 * A fix has to choose between a real upsert (onConflict().merge()), delete-then-insert, and
 * dropping the constraint. All three satisfy every assertion below.
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

/** The row the service accepts as an active reset request: unconfirmed and unexpired. */
async function activeForgotRow(userId: number) {
    return db
        .engine()('password_forgot')
        .select('*')
        .where({ userId, confirmed: false })
        .andWhere('expiresAt', '>', new Date().toISOString())
        .orderBy('id', 'desc')
        .first();
}

/** forget -> confirm -> forget-change, i.e. one complete password reset. */
async function completeReset(
    agent: ReturnType<typeof request.agent>,
    email: string,
    userId: number,
    newPassword: string,
): Promise<void> {
    await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);

    const record = await activeForgotRow(userId);
    expect(record).toBeDefined();

    const confirmRes = await agent
        .post('/auth/forget-confirm')
        .send({ confirmationCode: record.confirmationCode, email })
        .expect(HttpCode.OK);

    await agent
        .post(`/auth/${confirmRes.body.data.userId}/forget-change`)
        .set('authorization', `Bearer ${confirmRes.body.data.resetToken}`)
        .send({ newPassword })
        .expect(HttpCode.NO_CONTENT);
}

describe('1. One reset - the control case', () => {
    // Passes today. It is here so the failures below read as "repeats are broken" rather
    // than "password reset is broken".
    it('a first reset completes and moves the password', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: PASSWORD_1 });
        userIds.push(userId);

        await completeReset(agent, email, userId, PASSWORD_2);

        await agent.post('/auth/login').send({ email, password: PASSWORD_2 }).expect(HttpCode.OK);
        await agent.post('/auth/login').send({ email, password: PASSWORD_1 }).expect(HttpCode.BAD_REQUEST);
    });
});

describe('2. Asking again before confirming', () => {
    it('a repeated request replaces the pending code with a fresh one', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: PASSWORD_1 });
        userIds.push(userId);

        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);
        const first = await activeForgotRow(userId);
        expect(first).toBeDefined();

        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);
        const second = await activeForgotRow(userId);

        // Fix-agnostic: upsert, delete-then-insert and dropping the constraint all leave an
        // active request carrying the code the second call generated.
        expect(second).toBeDefined();
        expect(second.confirmationCode).not.toBe(first.confirmationCode);
        expect(new Date(second.expiresAt).getTime()).toBeGreaterThanOrEqual(new Date(first.expiresAt).getTime());
    });

    it('the code from the second mail confirms the reset', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: PASSWORD_1 });
        userIds.push(userId);

        // The user never received the first mail and asked again - the code they hold is
        // the one the second request generated.
        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);
        const first = await activeForgotRow(userId);

        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);
        const second = await activeForgotRow(userId);
        expect(second.confirmationCode).not.toBe(first.confirmationCode);

        await agent.post('/auth/forget-confirm').send({ confirmationCode: second.confirmationCode, email }).expect(HttpCode.OK);
    });
});

describe('3. Resetting a second time', () => {
    it('a user who already reset their password can reset it again', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: PASSWORD_1 });
        userIds.push(userId);

        await completeReset(agent, email, userId, PASSWORD_2);
        await agent.post('/auth/login').send({ email, password: PASSWORD_2 }).expect(HttpCode.OK);

        // Same flow again - this is what forgetting the password twice looks like.
        await completeReset(agent, email, userId, PASSWORD_3);

        await agent.post('/auth/login').send({ email, password: PASSWORD_3 }).expect(HttpCode.OK);
        await agent.post('/auth/login').send({ email, password: PASSWORD_2 }).expect(HttpCode.BAD_REQUEST);
    });

    it('a second request after a completed reset creates a new active request', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: PASSWORD_1 });
        userIds.push(userId);

        await completeReset(agent, email, userId, PASSWORD_2);

        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);

        // The row from the finished reset is `confirmed = true`; a fresh unconfirmed one has
        // to exist alongside it, or getActiveByEmail finds nothing and the flow is dead.
        const active = await activeForgotRow(userId);
        expect(active).toBeDefined();
        expect(active.confirmed).toBe(false);
    });

    it('forget-refresh works on the request that follows a completed reset', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: PASSWORD_1 });
        userIds.push(userId);

        await completeReset(agent, email, userId, PASSWORD_2);

        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);
        const before = await activeForgotRow(userId);
        expect(before).toBeDefined();

        await agent.post('/auth/forget-refresh').send({ email }).expect(HttpCode.NO_CONTENT);
        const after = await activeForgotRow(userId);

        expect(after.confirmationCode).not.toBe(before.confirmationCode);
        await agent.post('/auth/forget-confirm').send({ confirmationCode: after.confirmationCode, email }).expect(HttpCode.OK);
    });
});
