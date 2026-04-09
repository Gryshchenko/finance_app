/**
 * Validation tests — Account routes
 *
 * POST  /user/:userId/account/
 * PATCH /user/:userId/account/:accountId
 * GET   /user/:userId/account/:accountId
 * DELETE /user/:userId/account/:accountId
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
let existingAccountId: number;

const validCreate = {
    currencyId: 1,
    accountName: 'ValidName',
    amount: 100,
    iconId: 'icon_wallet',
};

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    server = app.listen(port);
    agent = request.agent(app);
    const db = new DatabaseConnection(config);
    const result = await createUser({ agent, databaseConnection: db });
    userId = result.userId;
    authorization = result.authorization;
    userIds.push(userId);

    const res = await agent.post(`/user/${userId}/account/`).set('authorization', authorization).send(validCreate);
    existingAccountId = res.body.data.accountId;
});

afterAll((done) => {
    userIds.forEach(async (id) => {
        await deleteUserAfterTest(id, DatabaseConnection.instance(config));
    });
    (server as { close: (cb: () => void) => void }).close(done);
});

// ─── POST /user/:userId/account/ ─────────────────────────────────────────────

describe('POST /user/:userId/account/ — body validation', () => {
    const url = () => `/user/${userId}/account/`;

    // required fields
    it('400 — missing currencyId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ accountName: 'Test', amount: 0, iconId: 'icon_x' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing accountName', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ currencyId: 1, amount: 0, iconId: 'icon_x' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing amount', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ currencyId: 1, accountName: 'Test', iconId: 'icon_x' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing iconId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ currencyId: 1, accountName: 'Test', amount: 0 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — empty body', async () => {
        await agent.post(url()).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    // accountName constraints
    it('400 — accountName too short (< 3 chars)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCreate, accountName: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — accountName too long (> 128 chars)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCreate, accountName: 'a'.repeat(129) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — accountName is a number', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCreate, accountName: 123 })
            .expect(HttpCode.BAD_REQUEST);
    });

    // amount constraints
    it('400 — amount is a string', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCreate, amount: 'not-a-number' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — amount exceeds MAX_SAFE_INTEGER', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCreate, amount: Number.MAX_SAFE_INTEGER + 1 })
            .expect(HttpCode.BAD_REQUEST);
    });

    // currencyId
    it('400 — currencyId is a string', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCreate, currencyId: 'abc' })
            .expect(HttpCode.BAD_REQUEST);
    });

    // iconId constraints
    it('400 — iconId too short (< 3 chars)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCreate, iconId: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — iconId too long (> 128 chars)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCreate, iconId: 'a'.repeat(129) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — iconId is a number', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCreate, iconId: 999 })
            .expect(HttpCode.BAD_REQUEST);
    });

    // unknown fields
    it('400 — extra unknown field', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCreate, hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    // query string
    it('400 — unexpected query param', async () => {
        await agent.post(`${url()}?foo=bar`).set('authorization', authorization).send(validCreate).expect(HttpCode.BAD_REQUEST);
    });

    // auth
    it('401 — no authorization header', async () => {
        await agent.post(url()).send(validCreate).expect(HttpCode.UNAUTHORIZED);
    });
});

// ─── PATCH /user/:userId/account/:accountId ───────────────────────────────────

describe('PATCH /user/:userId/account/:accountId — body & param validation', () => {
    const url = (id: number | string) => `/user/${userId}/account/${id}`;

    // empty body
    it('400 — empty body (at least one field required)', async () => {
        await agent.patch(url(existingAccountId)).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    // accountName
    it('400 — accountName too short', async () => {
        await agent
            .patch(url(existingAccountId))
            .set('authorization', authorization)
            .send({ accountName: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — accountName too long', async () => {
        await agent
            .patch(url(existingAccountId))
            .set('authorization', authorization)
            .send({ accountName: 'a'.repeat(129) })
            .expect(HttpCode.BAD_REQUEST);
    });

    // amount
    it('400 — amount is a string', async () => {
        await agent
            .patch(url(existingAccountId))
            .set('authorization', authorization)
            .send({ amount: 'bad' })
            .expect(HttpCode.BAD_REQUEST);
    });

    // status
    it('400 — status out of range (< 2)', async () => {
        await agent
            .patch(url(existingAccountId))
            .set('authorization', authorization)
            .send({ status: 1 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — status out of range (> 3)', async () => {
        await agent
            .patch(url(existingAccountId))
            .set('authorization', authorization)
            .send({ status: 4 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — status is a string', async () => {
        await agent
            .patch(url(existingAccountId))
            .set('authorization', authorization)
            .send({ status: 'active' })
            .expect(HttpCode.BAD_REQUEST);
    });

    // iconId
    it('400 — iconId too short', async () => {
        await agent
            .patch(url(existingAccountId))
            .set('authorization', authorization)
            .send({ iconId: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    // unknown fields
    it('400 — unknown field in patch body', async () => {
        await agent
            .patch(url(existingAccountId))
            .set('authorization', authorization)
            .send({ accountName: 'ValidName', hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    // path param :accountId
    it('400 — accountId is a string', async () => {
        await agent
            .patch(url('abc'))
            .set('authorization', authorization)
            .send({ accountName: 'Test' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — accountId is negative', async () => {
        await agent.patch(url(-1)).set('authorization', authorization).send({ accountName: 'Test' }).expect(HttpCode.BAD_REQUEST);
    });

    // query string
    it('400 — unexpected query param', async () => {
        await agent
            .patch(`${url(existingAccountId)}?foo=bar`)
            .set('authorization', authorization)
            .send({ accountName: 'Test' })
            .expect(HttpCode.BAD_REQUEST);
    });
});

// ─── GET /user/:userId/account/:accountId ────────────────────────────────────

describe('GET /user/:userId/account/:accountId — param validation', () => {
    const url = (id: number | string) => `/user/${userId}/account/${id}`;

    it('400 — accountId is a string', async () => {
        await agent.get(url('abc')).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — accountId is negative', async () => {
        await agent.get(url(-1)).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unexpected query param', async () => {
        await agent
            .get(`${url(existingAccountId)}?foo=bar`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('404 — non-existent accountId', async () => {
        await agent.get(url(999999999)).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
    });
});

// ─── DELETE /user/:userId/account/:accountId ──────────────────────────────────

describe('DELETE /user/:userId/account/:accountId — param validation', () => {
    const url = (id: number | string) => `/user/${userId}/account/${id}`;

    it('400 — accountId is a string (with trailing brace)', async () => {
        await agent.delete(url('99999999}')).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — accountId is negative', async () => {
        await agent.delete(url(-1)).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unexpected query param', async () => {
        await agent
            .delete(`${url(existingAccountId)}?foo=bar`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });
});
