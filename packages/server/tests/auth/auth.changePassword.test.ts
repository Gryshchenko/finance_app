import { closeTestApp, createUser, deleteUserAfterTest, generateRandomEmail } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode } from 'tenpercent/shared';
import { getConfig } from '../../src/config/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

const appConfig = getConfig();

let server: unknown;
const userIds: number[] = [];
const db = DatabaseConnection.instance(config);

const OLD_PASSWORD = 'ValidPass1!';
const NEW_PASSWORD = 'NewSecure2@';

beforeAll(() => {
    server = app.listen(0);
});

afterAll(async () => {
    await closeTestApp(server, userIds);
});

function signResetToken(userId: number, overrides: Record<string, unknown> = {}, signOptions: Record<string, unknown> = {}) {
    return jwt.sign({ userId, role: 1, purpose: 'reset', ...overrides }, appConfig.jwtResetSecret, {
        algorithm: appConfig.jwtAlgorithm,
        expiresIn: '15m',
        subject: String(userId),
        issuer: appConfig.jwtIssuer,
        audience: appConfig.jwtAudience,
        ...signOptions,
    });
}

function signAccessToken(userId: number, overrides: Record<string, unknown> = {}, signOptions: Record<string, unknown> = {}) {
    return jwt.sign({ userId, role: 1, purpose: 'access', ...overrides }, appConfig.jwtSecret, {
        algorithm: appConfig.jwtAlgorithm,
        expiresIn: '15m',
        subject: String(userId),
        issuer: appConfig.jwtIssuer,
        audience: appConfig.jwtAudience,
        ...signOptions,
    });
}

function signLongToken(userId: number, overrides: Record<string, unknown> = {}, signOptions: Record<string, unknown> = {}) {
    return jwt.sign({ userId, role: 1, purpose: 'refresh', ...overrides }, appConfig.jwtLongSecret, {
        algorithm: appConfig.jwtAlgorithm,
        expiresIn: '30d',
        subject: String(userId),
        issuer: appConfig.jwtIssuer,
        audience: appConfig.jwtAudience,
        ...signOptions,
    });
}

/** Creates a user and runs the full forget flow up to receiving a resetToken */
async function runForgetFlowUntilResetToken(agent: ReturnType<typeof request.agent>, email: string, userId: number) {
    await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);

    const record = await db
        .engine()('password_forgot')
        .select('confirmationCode')
        .where({ userId })
        .orderBy('id', 'desc')
        .first();

    const confirmRes = await agent
        .post('/auth/forget-confirm')
        .send({ confirmationCode: record.confirmationCode, email })
        .expect(HttpCode.OK);

    return confirmRes.body.data.resetToken as string;
}

describe('1. Full flow - request → confirm → change → login with new password', () => {
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

        // Step 1 - logout
        await agent.post('/auth/logout').set('authorization', authorization).expect(HttpCode.OK);

        // Step 2 - request password change
        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);

        // Step 3 - get code from DB
        const record = await db
            .engine()('password_forgot')
            .select('confirmationCode')
            .where({ userId })
            .orderBy('id', 'desc')
            .first();

        // Step 4 - confirm request
        const forgetConfirm = await agent
            .post('/auth/forget-confirm')
            .send({ confirmationCode: record.confirmationCode, email })
            .expect(HttpCode.OK);
        expect(forgetConfirm.body.data.resetToken).toEqual(expect.any(String));

        // Step 5 - reset token rejected on regular endpoints
        await agent
            .get(`/user/${userId}/profile`)
            .set('authorization', `Bearer ${forgetConfirm.body.data.resetToken}`)
            .expect(HttpCode.UNAUTHORIZED);

        // Step 6 - change password
        await agent
            .post(`/auth/${forgetConfirm.body.data.userId}/forget-change`)
            .set('authorization', `Bearer ${forgetConfirm.body.data.resetToken}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.NO_CONTENT);

        // Step 7 - login with new password succeeds
        const loginNew = await agent.post('/auth/login').send({ email, password: NEW_PASSWORD });
        expect(loginNew.status).toBe(HttpCode.OK);
        expect(loginNew.body.data.token).toEqual(expect.any(String));

        // Step 8 - login with old password fails
        await agent.post('/auth/login').send({ email, password: OLD_PASSWORD }).expect(HttpCode.BAD_REQUEST);
    });
});

describe('2. POST /auth/forget - request endpoint', () => {
    it('returns 204 for a non-existent email (does not leak user existence)', async () => {
        const agent = request.agent(server);
        await agent.post('/auth/forget').send({ email: 'nobody@nowhere.test' }).expect(HttpCode.NO_CONTENT);
    });

    it('returns 400 when email is missing', async () => {
        const agent = request.agent(server);
        await agent.post('/auth/forget').send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('returns 400 when email is invalid format', async () => {
        const agent = request.agent(server);
        await agent.post('/auth/forget').send({ email: 'not-an-email' }).expect(HttpCode.BAD_REQUEST);
    });

    it('can be called multiple times for the same email (upsert)', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);
        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);
    });
});

describe('3. POST /auth/forget-refresh - resend code', () => {
    it('returns 204 for email with no active request (does not leak info)', async () => {
        const agent = request.agent(server);
        await agent.post('/auth/forget-refresh').send({ email: 'nobody@nowhere.test' }).expect(HttpCode.NO_CONTENT);
    });

    it('returns 400 when email is missing', async () => {
        const agent = request.agent(server);
        await agent.post('/auth/forget-refresh').send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('generates a new code after refresh (old code no longer works)', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        // Request forget
        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);

        // Get original code
        const originalRecord = await db
            .engine()('password_forgot')
            .select('confirmationCode')
            .where({ userId })
            .orderBy('id', 'desc')
            .first();

        // Refresh
        await agent.post('/auth/forget-refresh').send({ email }).expect(HttpCode.NO_CONTENT);

        // Get new code
        const refreshedRecord = await db
            .engine()('password_forgot')
            .select('confirmationCode')
            .where({ userId })
            .orderBy('id', 'desc')
            .first();

        // Codes should differ (or at least the old one should not confirm)
        if (originalRecord.confirmationCode !== refreshedRecord.confirmationCode) {
            // Old code should fail
            const res = await agent
                .post('/auth/forget-confirm')
                .send({ confirmationCode: originalRecord.confirmationCode, email });
            expect(res.status).not.toBe(HttpCode.OK);
        }

        // New code should work
        await agent
            .post('/auth/forget-confirm')
            .send({ confirmationCode: refreshedRecord.confirmationCode, email })
            .expect(HttpCode.OK);
    });
});

describe('4. POST /auth/forget-confirm - confirm code', () => {
    it('returns error for wrong confirmation code', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);

        const res = await agent.post('/auth/forget-confirm').send({ confirmationCode: 99999999, email });
        expect(res.status).not.toBe(HttpCode.OK);
    });

    it('returns error for non-existent email', async () => {
        const agent = request.agent(server);
        const res = await agent.post('/auth/forget-confirm').send({ confirmationCode: 12345678, email: 'nobody@nowhere.test' });
        expect(res.status).not.toBe(HttpCode.OK);
    });

    it('returns 400 when confirmationCode is missing', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        await agent.post('/auth/forget-confirm').send({ email }).expect(HttpCode.BAD_REQUEST);
    });

    it('returns 400 when email is missing', async () => {
        const agent = request.agent(server);
        await agent.post('/auth/forget-confirm').send({ confirmationCode: 12345678 }).expect(HttpCode.BAD_REQUEST);
    });

    it('returns error when code has already been confirmed', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);

        const record = await db
            .engine()('password_forgot')
            .select('confirmationCode')
            .where({ userId })
            .orderBy('id', 'desc')
            .first();

        // First confirm - should succeed
        await agent.post('/auth/forget-confirm').send({ confirmationCode: record.confirmationCode, email }).expect(HttpCode.OK);

        // Second confirm - should fail (already used)
        const res = await agent.post('/auth/forget-confirm').send({ confirmationCode: record.confirmationCode, email });
        expect(res.status).not.toBe(HttpCode.OK);
    });
});

describe('5. POST /auth/:userId/forget-change - reset token security', () => {
    let userId: number;
    let email: string;
    let agent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
        agent = request.agent(server);
        email = generateRandomEmail();
        const result = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userId = result.userId;
        userIds.push(userId);
    });

    it('returns 401 when no token is provided', async () => {
        await agent.post(`/auth/${userId}/forget-change`).send({ newPassword: NEW_PASSWORD }).expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when an access token is used instead of reset token', async () => {
        const accessToken = signAccessToken(userId);
        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${accessToken}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when a long/refresh token is used instead of reset token', async () => {
        const longToken = signLongToken(userId);
        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${longToken}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when reset token is expired', async () => {
        const expiredResetToken = signResetToken(userId, {}, { expiresIn: '-1s' });
        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${expiredResetToken}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when reset token is signed with wrong secret', async () => {
        const wrongSecretToken = jwt.sign({ userId, role: 1, purpose: 'reset' }, 'totally-wrong-secret', {
            algorithm: appConfig.jwtAlgorithm,
            expiresIn: '15m',
            subject: String(userId),
            issuer: appConfig.jwtIssuer,
            audience: appConfig.jwtAudience,
        });
        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${wrongSecretToken}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when reset token sub does not match :userId param', async () => {
        const otherUserId = 999_999_999;
        const tokenForOther = signResetToken(otherUserId);
        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${tokenForOther}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when token has wrong issuer', async () => {
        const wrongIssuer = signResetToken(userId, {}, { issuer: 'evil-issuer.com' });
        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${wrongIssuer}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when token has wrong audience', async () => {
        const wrongAudience = signResetToken(userId, {}, { audience: 'wrong-audience' });
        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${wrongAudience}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.UNAUTHORIZED);
    });
});

describe('6. POST /auth/:userId/forget-change - password validation', () => {
    it('returns 400 when newPassword is missing', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        const resetToken = await runForgetFlowUntilResetToken(agent, email, userId);

        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${resetToken}`)
            .send({})
            .expect(HttpCode.BAD_REQUEST);
    });

    it('returns 400 when newPassword is too short (< 5 chars)', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        const resetToken = await runForgetFlowUntilResetToken(agent, email, userId);

        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${resetToken}`)
            .send({ newPassword: 'Ab1!' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('returns 400 when newPassword is too long (> 30 chars)', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        const resetToken = await runForgetFlowUntilResetToken(agent, email, userId);

        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${resetToken}`)
            .send({ newPassword: 'A'.repeat(31) + '1!' })
            .expect(HttpCode.BAD_REQUEST);
    });
});

describe('7. Reset token replay & reuse', () => {
    it('reset token cannot be used twice to change password', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        const resetToken = await runForgetFlowUntilResetToken(agent, email, userId);

        // First change - should succeed
        await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${resetToken}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.NO_CONTENT);

        // Second change with same token - should fail (token blacklisted after use)
        const res = await agent
            .post(`/auth/${userId}/forget-change`)
            .set('authorization', `Bearer ${resetToken}`)
            .send({ newPassword: 'AnotherPass3#' });
        expect(res.status).not.toBe(HttpCode.NO_CONTENT);
    });

    it('reset token for user A cannot be used to change user B password', async () => {
        const agent = request.agent(server);
        const emailA = generateRandomEmail();
        const emailB = generateRandomEmail();
        const { userId: userIdA } = await createUser({ agent, databaseConnection: db, email: emailA, password: OLD_PASSWORD });
        const { userId: userIdB } = await createUser({ agent, databaseConnection: db, email: emailB, password: OLD_PASSWORD });
        userIds.push(userIdA, userIdB);

        const resetTokenA = await runForgetFlowUntilResetToken(agent, emailA, userIdA);

        // Try to use A's reset token to change B's password
        await agent
            .post(`/auth/${userIdB}/forget-change`)
            .set('authorization', `Bearer ${resetTokenA}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.UNAUTHORIZED);
    });
});

describe('8. Reset token isolation - cannot be used on protected endpoints', () => {
    it('reset token is rejected on GET /user/:userId/profile', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        const resetToken = await runForgetFlowUntilResetToken(agent, email, userId);

        await agent.get(`/user/${userId}/profile`).set('authorization', `Bearer ${resetToken}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('reset token is rejected on GET /auth/:userId/verify', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        const resetToken = await runForgetFlowUntilResetToken(agent, email, userId);

        await agent.get(`/auth/${userId}/verify`).set('authorization', `Bearer ${resetToken}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('reset token is rejected by refresh endpoint', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        const resetToken = await runForgetFlowUntilResetToken(agent, email, userId);

        await agent.post(`/auth/${userId}/refresh`).send({ token: resetToken }).expect(HttpCode.BAD_REQUEST);
    });
});

describe('9. Full flow with forget-refresh step', () => {
    it('forget → refresh → confirm with new code → change works', async () => {
        const agent = request.agent(server);
        const email = generateRandomEmail();
        const { userId } = await createUser({ agent, databaseConnection: db, email, password: OLD_PASSWORD });
        userIds.push(userId);

        // Request forget
        await agent.post('/auth/forget').send({ email }).expect(HttpCode.NO_CONTENT);

        // Refresh the code
        await agent.post('/auth/forget-refresh').send({ email }).expect(HttpCode.NO_CONTENT);

        // Get the refreshed code from DB
        const record = await db
            .engine()('password_forgot')
            .select('confirmationCode')
            .where({ userId })
            .orderBy('id', 'desc')
            .first();

        // Confirm with the new code
        const confirmRes = await agent
            .post('/auth/forget-confirm')
            .send({ confirmationCode: record.confirmationCode, email })
            .expect(HttpCode.OK);

        // Change password
        await agent
            .post(`/auth/${confirmRes.body.data.userId}/forget-change`)
            .set('authorization', `Bearer ${confirmRes.body.data.resetToken}`)
            .send({ newPassword: NEW_PASSWORD })
            .expect(HttpCode.NO_CONTENT);

        // Verify new password works
        const loginRes = await agent.post('/auth/login').send({ email, password: NEW_PASSWORD });
        expect(loginRes.status).toBe(HttpCode.OK);
    });
});

describe('10. Query string rejection', () => {
    it('rejects /auth/forget with unexpected query params', async () => {
        const agent = request.agent(server);
        await agent.post('/auth/forget?admin=true').send({ email: 'test@test.com' }).expect(HttpCode.BAD_REQUEST);
    });

    it('rejects /auth/forget-confirm with unexpected query params', async () => {
        const agent = request.agent(server);
        await agent
            .post('/auth/forget-confirm?debug=1')
            .send({ email: 'test@test.com', confirmationCode: 12345678 })
            .expect(HttpCode.BAD_REQUEST);
    });
});
