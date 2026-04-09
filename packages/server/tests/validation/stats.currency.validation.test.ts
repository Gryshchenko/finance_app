/**
 * Validation tests — Stats, Currency & Exchange-rate routes
 *
 * GET /user/:userId/incomes/stats
 * GET /user/:userId/categories/stats
 * GET /user/:userId/stats/summary
 * GET /currencies
 * GET /currency
 * GET /exchange-rates
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
let userId: number;
let authorization: string;

const validFrom = '2024-01-01T00:00:00.000Z';
const validTo = '2024-12-31T23:59:59.999Z';
const validPeriod = 'month';

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    server = app.listen(port);
    agent = request.agent(app);
    const db = new DatabaseConnection(config);
    const result = await createUser({ agent, databaseConnection: db });
    userId = result.userId;
    authorization = result.authorization;
    userIds.push(userId);
});

afterAll((done) => {
    userIds.forEach(async (id) => {
        await deleteUserAfterTest(id, DatabaseConnection.instance(config));
    });
    (server as { close: (cb: () => void) => void }).close(done);
});

// ─── GET /user/:userId/incomes/stats ──────────────────────────────────────────

describe('GET /user/:userId/incomes/stats — query validation', () => {
    const url = (q: string) => `/user/${userId}/incomes/stats?${q}`;

    it('400 — missing from', async () => {
        await agent
            .get(url(`to=${validTo}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing to', async () => {
        await agent
            .get(url(`from=${validFrom}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing period', async () => {
        await agent
            .get(url(`from=${validFrom}&to=${validTo}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — from is not ISO8601', async () => {
        await agent
            .get(url(`from=not-a-date&to=${validTo}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — to is not ISO8601', async () => {
        await agent
            .get(url(`from=${validFrom}&to=not-a-date&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — from is greater than to', async () => {
        await agent
            .get(url(`from=${validTo}&to=${validFrom}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unknown query param', async () => {
        await agent
            .get(url(`from=${validFrom}&to=${validTo}&period=${validPeriod}&hack=true`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('200 — valid query returns stats', async () => {
        const res = await agent
            .get(url(`from=${validFrom}&to=${validTo}&period=${validPeriod}`))
            .set('authorization', authorization);
        expect(res.status).toBe(HttpCode.OK);
    });
});

// ─── GET /user/:userId/categories/stats ───────────────────────────────────────

describe('GET /user/:userId/categories/stats — query validation', () => {
    const url = (q: string) => `/user/${userId}/categories/stats?${q}`;

    it('400 — missing from', async () => {
        await agent
            .get(url(`to=${validTo}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing to', async () => {
        await agent
            .get(url(`from=${validFrom}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing period', async () => {
        await agent
            .get(url(`from=${validFrom}&to=${validTo}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — from is not ISO8601', async () => {
        await agent
            .get(url(`from=bad&to=${validTo}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — from is greater than to', async () => {
        await agent
            .get(url(`from=${validTo}&to=${validFrom}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unknown query param', async () => {
        await agent
            .get(url(`from=${validFrom}&to=${validTo}&period=${validPeriod}&x=1`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });
});

// ─── GET /user/:userId/stats/summary ─────────────────────────────────────────

describe('GET /user/:userId/stats/summary — query validation', () => {
    const url = (q: string) => `/user/${userId}/stats/summary?${q}`;

    it('400 — missing from', async () => {
        await agent
            .get(url(`to=${validTo}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing to', async () => {
        await agent
            .get(url(`from=${validFrom}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing period', async () => {
        await agent
            .get(url(`from=${validFrom}&to=${validTo}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — from is not ISO8601', async () => {
        await agent
            .get(url(`from=not-a-date&to=${validTo}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — from is greater than to', async () => {
        await agent
            .get(url(`from=${validTo}&to=${validFrom}&period=${validPeriod}`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unknown query param', async () => {
        await agent
            .get(url(`from=${validFrom}&to=${validTo}&period=${validPeriod}&x=1`))
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('401 — no authorization header', async () => {
        await agent.get(url(`from=${validFrom}&to=${validTo}&period=${validPeriod}`)).expect(HttpCode.UNAUTHORIZED);
    });
});

// ─── GET /currencies ─────────────────────────────────────────────────────────

describe('GET /currencies — route validation', () => {
    it('200 — returns list of currencies', async () => {
        const res = await agent.get('/currencies').set('authorization', authorization);
        expect(res.status).toBe(HttpCode.OK);
    });

    it('400 — unexpected query param', async () => {
        await agent.get('/currencies?foo=bar').set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });
});

// ─── GET /exchange-rates ──────────────────────────────────────────────────────

describe('GET /exchange-rates — query validation', () => {
    it('400 — missing currency param', async () => {
        await agent.get('/exchange-rates?targetCurrency=EUR').set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing targetCurrency param', async () => {
        await agent.get('/exchange-rates?currency=USD').set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — empty query string', async () => {
        await agent.get('/exchange-rates').set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unknown extra query param', async () => {
        await agent
            .get('/exchange-rates?currency=USD&targetCurrency=EUR&hack=true')
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });
});

// ─── GET /user/:userId — path param validation ────────────────────────────────

describe('GET /user/:userId — path param validation', () => {
    it('403 — userId is a string', async () => {
        await agent.get('/user/abc').set('authorization', authorization).expect(HttpCode.FORBIDDEN);
    });

    it('403 — userId is negative', async () => {
        await agent.get('/user/-1').set('authorization', authorization).expect(HttpCode.FORBIDDEN);
    });

    it('400 — unexpected query param', async () => {
        await agent.get(`/user/${userId}?foo=bar`).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('401 — no authorization header', async () => {
        await agent.get(`/user/${userId}`).expect(HttpCode.UNAUTHORIZED);
    });
});
