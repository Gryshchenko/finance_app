/**
 * Session / Token Security Tests
 *
 * Covers:
 *  1. Token format & absence
 *  2. Signature tampering & algorithm confusion
 *  3. Claims validation (exp, iss, aud, sub)
 *  4. Token blacklist after logout
 *  5. Cross-user resource isolation
 *  6. Long-token / refresh security
 *
 * Tests marked [BUG] document a current vulnerability.
 * They are written with the EXPECTED secure behaviour -
 * so they will FAIL until the bug is fixed.
 */

import { closeTestApp, createUser, deleteUserAfterTest, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode, UserStatus } from 'tenpercent/shared';
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

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    server = app.listen(port);
});

afterAll(async () => {
    await closeTestApp(server, userIds);
});

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Signs a short-lived access token (jwtSecret). */
function signAccessToken(userId: number, overrides: Record<string, unknown> = {}, signOptions: Record<string, unknown> = {}) {
    return jwt.sign({ userId, role: 1, ...overrides }, appConfig.jwtSecret, {
        algorithm: appConfig.jwtAlgorithm,
        expiresIn: '15m',
        subject: String(userId),
        issuer: appConfig.jwtIssuer,
        audience: appConfig.jwtAudience,
        ...signOptions,
    });
}

/** Signs a long token (jwtLongSecret). */
function signLongToken(userId: number, overrides: Record<string, unknown> = {}, signOptions: Record<string, unknown> = {}) {
    return jwt.sign({ userId, role: 1, ...overrides }, appConfig.jwtLongSecret, {
        algorithm: appConfig.jwtAlgorithm,
        expiresIn: '30d',
        subject: String(userId),
        issuer: appConfig.jwtIssuer,
        audience: appConfig.jwtAudience,
        ...signOptions,
    });
}

/** A protected endpoint stable for all tests. */
const profileUrl = (userId: number) => `/user/${userId}/profile`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Token format & absence
// ─────────────────────────────────────────────────────────────────────────────

describe('1. Token format & absence', () => {
    let userId: number;
    let agent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent });
        userId = result.userId;
        userIds.push(userId);
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cases: { label: string; header: string | null }[] = [
        { label: 'no Authorization header', header: null },
        { label: 'empty string', header: '' },
        { label: '"Bearer" with no token', header: 'Bearer' },
        { label: '"Bearer " trailing space only', header: 'Bearer ' },
        { label: '"Bearer null"', header: 'Bearer null' },
        { label: '"Bearer undefined"', header: 'Bearer undefined' },
        { label: 'Basic scheme instead of Bearer', header: 'Basic dXNlcjpwYXNz' },
        { label: 'random non-JWT string', header: 'not-a-token-at-all' },
        { label: 'JWT with only 2 parts (no sig)', header: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9' },
    ];

    it.each(cases)('returns 401 when $label', async ({ header }) => {
        const req = agent.get(profileUrl(userId));
        if (header !== null) req.set('authorization', header);
        await req.expect(HttpCode.UNAUTHORIZED);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Signature tampering & algorithm confusion
// ─────────────────────────────────────────────────────────────────────────────

describe('2. Signature tampering & algorithm confusion', () => {
    let userId: number;
    let agent: ReturnType<typeof request.agent>;
    let validToken: string;

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent });
        userId = result.userId;
        userIds.push(userId);
        validToken = signAccessToken(userId);
    });

    it('returns 401 when signed with a random wrong secret', async () => {
        const tampered = jwt.sign({ userId, role: 1 }, 'totally-wrong-secret', {
            algorithm: appConfig.jwtAlgorithm,
            expiresIn: '15m',
            subject: String(userId),
            issuer: appConfig.jwtIssuer,
            audience: appConfig.jwtAudience,
        });
        await agent.get(profileUrl(userId)).set('authorization', `Bearer ${tampered}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when payload is mutated but original signature is kept', async () => {
        const [header, payload, signature] = validToken.split('.');
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
        decoded.role = 999; // attempt privilege escalation
        const mutatedPayload = Buffer.from(JSON.stringify(decoded)).toString('base64url');
        await agent
            .get(profileUrl(userId))
            .set('authorization', `Bearer ${header}.${mutatedPayload}.${signature}`)
            .expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 for alg=none attack (unsigned token)', async () => {
        // RFC 7518 §3.6 – "none" must be rejected when the server expects a secret algorithm
        const [, payload] = validToken.split('.');
        const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
        const noneToken = `${noneHeader}.${payload}.`;
        await agent.get(profileUrl(userId)).set('authorization', `Bearer ${noneToken}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when long-token secret is used to sign an access token', async () => {
        // jwtLongSecret ≠ jwtSecret - passport-jwt verifies with jwtSecret only
        const wrongSecretToken = signLongToken(userId); // valid long token
        await agent.get(profileUrl(userId)).set('authorization', `Bearer ${wrongSecretToken}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when the signature is truncated', async () => {
        const truncated = validToken.slice(0, -8);
        await agent.get(profileUrl(userId)).set('authorization', `Bearer ${truncated}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 when the signature is replaced with garbage', async () => {
        const [header, payload] = validToken.split('.');
        await agent
            .get(profileUrl(userId))
            .set('authorization', `Bearer ${header}.${payload}.AAAAAAAAAAAAAAAAAAAAAAAAAAAA`)
            .expect(HttpCode.UNAUTHORIZED);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. JWT claims validation
// ─────────────────────────────────────────────────────────────────────────────

describe('3. JWT claims validation', () => {
    let userId: number;
    let agent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
        agent = request.agent(server);
        const result = await createUser({ agent });
        userId = result.userId;
        userIds.push(userId);
    });

    it('returns 401 for an already-expired token', async () => {
        const expired = signAccessToken(userId, {}, { expiresIn: '-1s' });
        await agent.get(profileUrl(userId)).set('authorization', `Bearer ${expired}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 for a token with wrong issuer', async () => {
        const wrongIssuer = signAccessToken(userId, {}, { issuer: 'evil-issuer.com' });
        await agent.get(profileUrl(userId)).set('authorization', `Bearer ${wrongIssuer}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 for a token with wrong audience', async () => {
        const wrongAudience = signAccessToken(userId, {}, { audience: 'wrong-audience' });
        await agent.get(profileUrl(userId)).set('authorization', `Bearer ${wrongAudience}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 for a token whose sub points to a non-existent user', async () => {
        const ghostId = 999_999_999;
        const ghost = signAccessToken(ghostId);
        await agent.get(profileUrl(ghostId)).set('authorization', `Bearer ${ghost}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('returns 401 for a token with a float userId in sub', async () => {
        const floatToken = signAccessToken(userId, {}, { subject: `${userId}.5` });
        await agent.get(profileUrl(userId)).set('authorization', `Bearer ${floatToken}`).expect(HttpCode.UNAUTHORIZED);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Token blacklist (logout)
// ─────────────────────────────────────────────────────────────────────────────

describe('4. Token blacklist (logout)', () => {
    it('rejects every protected endpoint after logout', async () => {
        const agent = request.agent(server);
        const { userId, authorization } = await createUser({ agent });
        userIds.push(userId);

        // Works before logout
        await agent.get(profileUrl(userId)).set('authorization', authorization).expect(HttpCode.OK);

        await agent.post('/auth/logout').set('authorization', authorization).expect(HttpCode.OK);

        // All protected routes must now reject the old token
        await agent.get(profileUrl(userId)).set('authorization', authorization).expect(HttpCode.UNAUTHORIZED);
        await agent.get(`/user/${userId}`).set('authorization', authorization).expect(HttpCode.UNAUTHORIZED);
        await agent.get(`/user/${userId}/account/`).set('authorization', authorization).expect(HttpCode.UNAUTHORIZED);
        await agent.get(`/auth/${userId}/verify`).set('authorization', authorization).expect(HttpCode.UNAUTHORIZED);
    });

    it('second logout attempt returns 401 (token already blacklisted)', async () => {
        const agent = request.agent(server);
        const { userId, authorization } = await createUser({ agent });
        userIds.push(userId);

        await agent.post('/auth/logout').set('authorization', authorization).expect(HttpCode.OK);
        await agent.post('/auth/logout').set('authorization', authorization).expect(HttpCode.UNAUTHORIZED);
    });

    it('requires a valid token to logout (cannot logout without auth)', async () => {
        const agent = request.agent(server);
        await agent.post('/auth/logout').expect(HttpCode.UNAUTHORIZED);
    });

    it('login again after logout issues a new valid token', async () => {
        const agent = request.agent(server);
        const password = `Aa1!${Math.random().toString(36).slice(2, 10)}`;
        const email = `test_${Date.now()}@example.com`;
        const { userId, authorization } = await createUser({ agent, password, email });
        userIds.push(userId);

        await agent.post('/auth/logout').set('authorization', authorization).expect(HttpCode.OK);

        const loginResponse = await agent.post('/auth/login').send({ email, password });
        expect(loginResponse.status).toBe(HttpCode.OK);

        const newToken = loginResponse.body.data.token;
        expect(newToken).toEqual(expect.any(String));
        await agent.get(profileUrl(userId)).set('authorization', `Bearer ${newToken}`).expect(HttpCode.OK);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Cross-user resource isolation
// ─────────────────────────────────────────────────────────────────────────────

describe('5. Cross-user resource isolation', () => {
    let userA: { userId: number; authorization: string };
    let userB: { userId: number; authorization: string };
    let agent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
        const db = DatabaseConnection.instance(config);
        agent = request.agent(server);
        userA = await createUser({ agent, databaseConnection: db });
        userB = await createUser({ agent, databaseConnection: db });
        userIds.push(userA.userId, userB.userId);
    });

    const endpoints = (ownerId: number) => [
        `/user/${ownerId}/profile`,
        `/user/${ownerId}`,
        `/user/${ownerId}/account/`,
        `/user/${ownerId}/overview/`,
    ];

    it("user A's token cannot access user B's endpoints (403)", async () => {
        for (const url of endpoints(userB.userId)) {
            await agent.get(url).set('authorization', userA.authorization).expect(HttpCode.FORBIDDEN);
        }
    });

    it("user B's token cannot access user A's endpoints (403)", async () => {
        for (const url of endpoints(userA.userId)) {
            await agent.get(url).set('authorization', userB.authorization).expect(HttpCode.FORBIDDEN);
        }
    });

    it('manually crafted token for user B cannot access user A resources', async () => {
        // Valid signature, valid claims - but wrong userId in URL; tokenVerify rejects with 401
        const craftedForB = signAccessToken(userB.userId);
        await agent.get(profileUrl(userA.userId)).set('authorization', `Bearer ${craftedForB}`).expect(HttpCode.UNAUTHORIZED);
    });

    it("cannot write to another user's account via POST with own token", async () => {
        await agent
            .post(`/user/${userB.userId}/account/`)
            .set('authorization', userA.authorization)
            .send({ currencyId: 1, accountName: 'Hack', amount: 0, iconId: 'wallet' })
            .expect(HttpCode.FORBIDDEN);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Long-token / refresh security
// ─────────────────────────────────────────────────────────────────────────────

describe('6. Long-token / refresh security', () => {
    it('long token is rejected by protected endpoints (different secret)', async () => {
        const agent = request.agent(server);
        const { userId, longToken } = await createUser({ agent });
        userIds.push(userId);

        await agent.get(profileUrl(userId)).set('authorization', `Bearer ${longToken}`).expect(HttpCode.UNAUTHORIZED);
    });

    it('short (access) token is rejected by the refresh endpoint', async () => {
        const agent = request.agent(server);
        const { userId, authorization } = await createUser({ agent });
        userIds.push(userId);

        const shortToken = authorization.replace('Bearer ', '');
        await agent.post(`/auth/${userId}/refresh`).send({ token: shortToken }).expect(HttpCode.BAD_REQUEST);
    });

    it('refresh with token whose sub does not match :userId param returns 400', async () => {
        const agent = request.agent(server);
        const db = DatabaseConnection.instance(config);
        const { userId: userAId, longToken } = await createUser({ agent, databaseConnection: db });
        const { userId: userBId } = await createUser({ agent, databaseConnection: db });
        userIds.push(userAId, userBId);

        // userA's long token → try to refresh as userB
        await agent.post(`/auth/${userBId}/refresh`).send({ token: longToken }).expect(HttpCode.BAD_REQUEST);
    });

    /**
     * [BUG] ignoreExpiration: true in tokenLongVerify
     *
     * An expired long token is still accepted for refresh because
     * tokenLongVerify is called with { ignoreExpiration: true }.
     * This means a stolen long token can be used forever to obtain
     * new short-lived access tokens.
     *
     * Fix: remove ignoreExpiration or validate exp manually.
     * Evidence: the unit test for this case is commented out in tokenLongVerify.test.ts
     */
    it('[BUG] expired long token must be rejected by the refresh endpoint', async () => {
        const agent = request.agent(server);
        const { userId } = await createUser({ agent });
        userIds.push(userId);

        const expiredLongToken = signLongToken(userId, {}, { expiresIn: '-1s' });

        const response = await agent.post(`/auth/${userId}/refresh`).send({ token: expiredLongToken });

        // Currently returns 200 - should return 400
        expect(response.status).toBe(HttpCode.BAD_REQUEST);
    });

    it('long token must not produce a new access token after logout', async () => {
        const agent = request.agent(server);
        const { userId, authorization, longToken } = await createUser({ agent });
        userIds.push(userId);

        await agent.get(profileUrl(userId)).set('authorization', authorization).expect(HttpCode.OK);

        // Logout blacklists both the short token and the long token
        await agent.post('/auth/logout').set('authorization', authorization).send({ token: longToken }).expect(HttpCode.OK);

        const refreshResponse = await agent.post(`/auth/${userId}/refresh`).send({ token: longToken });

        expect(refreshResponse.status).toBe(HttpCode.UNAUTHORIZED);
    });

    it('suspended user must not be able to refresh their token', async () => {
        const agent = request.agent(server);
        const db = DatabaseConnection.instance(config);
        const { userId, longToken } = await createUser({ agent, databaseConnection: db });
        userIds.push(userId);

        await db.engine()('users').where({ userId }).update({ status: UserStatus.INACTIVE });

        const refreshResponse = await agent.post(`/auth/${userId}/refresh`).send({ token: longToken });

        expect(refreshResponse.status).toBe(HttpCode.FORBIDDEN);
    });
});
