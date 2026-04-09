/**
 * Validation tests — Auth routes
 *
 * POST /auth/login
 * POST /auth/logout
 * POST /auth/:userId/refresh
 */

import { createUser, deleteUserAfterTest, generateSecureRandom } from '../TestsUtils.';
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
let agent: ReturnType<typeof request.agent>;

const validEmail = `val_${Date.now()}@example.com`;
const validPassword = 'ValidPass1!';
let authorization: string;
let userId: number;
let longToken: string;

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    server = app.listen(port);
    agent = request.agent(app);
    const db = new DatabaseConnection(config);
    const result = await createUser({ agent, email: validEmail, password: validPassword, databaseConnection: db });
    userId = result.userId;
    authorization = result.authorization;
    longToken = result.longToken;
    userIds.push(userId);
});

afterAll((done) => {
    userIds.forEach(async (id) => {
        await deleteUserAfterTest(id, DatabaseConnection.instance(config));
    });
    (server as { close: (cb: () => void) => void }).close(done);
});

// ─── POST /auth/login ────────────────────────────────────────────────────────

describe('POST /auth/login — body validation', () => {
    const url = '/auth/login';

    // missing fields
    it('400 — missing email', async () => {
        await agent.post(url).send({ password: validPassword }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing password', async () => {
        await agent.post(url).send({ email: validEmail }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — empty body', async () => {
        await agent.post(url).send({}).expect(HttpCode.BAD_REQUEST);
    });

    // email rules
    it('400 — email is not an email address', async () => {
        await agent.post(url).send({ email: 'not-an-email', password: validPassword }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — email exceeds 150 chars', async () => {
        const longEmail = `${'a'.repeat(150)}@example.com`; // 37 chars
        await agent.post(url).send({ email: longEmail, password: validPassword }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — email is a number', async () => {
        await agent.post(url).send({ email: 123, password: validPassword }).expect(HttpCode.BAD_REQUEST);
    });

    // password rules
    it('400 — password too short (< 5 chars)', async () => {
        await agent.post(url).send({ email: validEmail, password: 'Ab1!' }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — password too long (> 30 chars)', async () => {
        await agent
            .post(url)
            .send({ email: validEmail, password: `ValidPass1!${'a'.repeat(25)}` })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — password is a number', async () => {
        await agent.post(url).send({ email: validEmail, password: 123456 }).expect(HttpCode.BAD_REQUEST);
    });

    // unknown fields
    it('400 — extra unknown field in body', async () => {
        await agent.post(url).send({ email: validEmail, password: validPassword, hack: true }).expect(HttpCode.BAD_REQUEST);
    });

    // query string
    it('400 — unexpected query param', async () => {
        await agent.post(`${url}?foo=bar`).send({ email: validEmail, password: validPassword }).expect(HttpCode.BAD_REQUEST);
    });

    // correct credentials
    it('200 — valid credentials return token', async () => {
        const res = await agent.post(url).send({ email: validEmail, password: validPassword });
        expect(res.status).toBe(HttpCode.OK);
        expect(res.body.data.token).toEqual(expect.any(String));
    });
});

// ─── POST /auth/logout ───────────────────────────────────────────────────────

describe('POST /auth/logout — validation', () => {
    it('401 — no authorization header', async () => {
        await agent.post('/auth/logout').expect(HttpCode.UNAUTHORIZED);
    });

    it('400 — unexpected query param', async () => {
        await agent.post('/auth/logout?foo=bar').set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });
});

// ─── POST /auth/:userId/refresh ──────────────────────────────────────────────

describe('POST /auth/:userId/refresh — body & param validation', () => {
    const url = (id: number | string) => `/auth/${id}/refresh`;

    // token field
    it('400 — missing token field', async () => {
        await agent.post(url(userId)).send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — token is a number', async () => {
        await agent.post(url(userId)).send({ token: 123 }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — short-token used instead of long-token', async () => {
        const shortToken = authorization.replace('Bearer ', '');
        await agent.post(url(userId)).send({ token: shortToken }).expect(HttpCode.BAD_REQUEST);
    });

    // path param :userId
    it('400 — userId is a string', async () => {
        await agent.post(url('abc')).send({ token: longToken }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — userId is negative', async () => {
        await agent.post(url(-1)).send({ token: longToken }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unexpected query param', async () => {
        await agent
            .post(`${url(userId)}?foo=bar`)
            .send({ token: longToken })
            .expect(HttpCode.BAD_REQUEST);
    });

    // valid case
    it('200 — valid long-token returns new access token', async () => {
        const res = await agent.post(url(userId)).send({ token: longToken });
        expect(res.status).toBe(HttpCode.OK);
        expect(res.body.data.token).toEqual(expect.any(String));
    });
});
