/**
 * Validation tests — Income & Category routes
 *
 * POST  /user/:userId/income/
 * PATCH /user/:userId/income/:incomeId
 * GET   /user/:userId/income/:incomeId
 * DELETE /user/:userId/income/:incomeId
 *
 * POST  /user/:userId/category/
 * PATCH /user/:userId/category/:categoryId
 * GET   /user/:userId/category/:categoryId
 * DELETE /user/:userId/category/:categoryId
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
let existingIncomeId: number;
let existingCategoryId: number;

const validIncome = { currencyId: 1, incomeName: 'ValidIncome', iconId: 'icon_income' };
const validCategory = { currencyId: 1, categoryName: 'ValidCategory', iconId: 'icon_category' };

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    server = app.listen(port);
    agent = request.agent(server);
    const db = new DatabaseConnection(config);
    const result = await createUser({ agent, databaseConnection: db });
    userId = result.userId;
    authorization = result.authorization;
    userIds.push(userId);

    const incomeRes = await agent.post(`/user/${userId}/income/`).set('authorization', authorization).send(validIncome);
    existingIncomeId = incomeRes.body.data.incomeId;

    const categoryRes = await agent.post(`/user/${userId}/category/`).set('authorization', authorization).send(validCategory);
    existingCategoryId = categoryRes.body.data.categoryId;
});

afterAll((done) => {
    userIds.forEach(async (id) => {
        await deleteUserAfterTest(id, DatabaseConnection.instance(config));
    });
    (server as { close: (cb: () => void) => void }).close(done);
});

// ─── POST /user/:userId/income/ ───────────────────────────────────────────────

describe('POST /user/:userId/income/ — body validation', () => {
    const url = () => `/user/${userId}/income/`;

    it('400 — missing incomeName', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ currencyId: 1, iconId: 'icon_x' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing currencyId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ incomeName: 'Test', iconId: 'icon_x' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing iconId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ currencyId: 1, incomeName: 'Test' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — empty body', async () => {
        await agent.post(url()).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — incomeName too short (< 3)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validIncome, incomeName: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — incomeName too long (> 128)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validIncome, incomeName: 'a'.repeat(129) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — incomeName is a number', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validIncome, incomeName: 123 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — iconId too short (< 3)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validIncome, iconId: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — iconId too long (> 128)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validIncome, iconId: 'a'.repeat(129) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — iconId is a number', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validIncome, iconId: 999 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — currencyId is a string', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validIncome, currencyId: 'abc' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — extra unknown field', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validIncome, hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unexpected query param', async () => {
        await agent.post(`${url()}?foo=bar`).set('authorization', authorization).send(validIncome).expect(HttpCode.BAD_REQUEST);
    });

    it('401 — no authorization header', async () => {
        await agent.post(url()).send(validIncome).expect(HttpCode.UNAUTHORIZED);
    });
});

// ─── PATCH /user/:userId/income/:incomeId ─────────────────────────────────────

describe('PATCH /user/:userId/income/:incomeId — body & param validation', () => {
    const url = (id: number | string) => `/user/${userId}/income/${id}`;

    it('400 — empty body', async () => {
        await agent.patch(url(existingIncomeId)).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — incomeName too short', async () => {
        await agent
            .patch(url(existingIncomeId))
            .set('authorization', authorization)
            .send({ incomeName: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — incomeName too long', async () => {
        await agent
            .patch(url(existingIncomeId))
            .set('authorization', authorization)
            .send({ incomeName: 'a'.repeat(129) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — status out of range (< 2)', async () => {
        await agent
            .patch(url(existingIncomeId))
            .set('authorization', authorization)
            .send({ status: 1 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — status out of range (> 3)', async () => {
        await agent
            .patch(url(existingIncomeId))
            .set('authorization', authorization)
            .send({ status: 4 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — status is a string', async () => {
        await agent
            .patch(url(existingIncomeId))
            .set('authorization', authorization)
            .send({ status: 'active' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — iconId too short', async () => {
        await agent
            .patch(url(existingIncomeId))
            .set('authorization', authorization)
            .send({ iconId: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unknown field in patch body', async () => {
        await agent
            .patch(url(existingIncomeId))
            .set('authorization', authorization)
            .send({ incomeName: 'ValidName', hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — incomeId is a string', async () => {
        await agent
            .patch(url('abc'))
            .set('authorization', authorization)
            .send({ incomeName: 'Test' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — incomeId is negative', async () => {
        await agent.patch(url(-1)).set('authorization', authorization).send({ incomeName: 'Test' }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unexpected query param', async () => {
        await agent
            .patch(`${url(existingIncomeId)}?foo=bar`)
            .set('authorization', authorization)
            .send({ incomeName: 'Test' })
            .expect(HttpCode.BAD_REQUEST);
    });
});

// ─── GET/DELETE /user/:userId/income/:incomeId ────────────────────────────────

describe('GET /user/:userId/income/:incomeId — param validation', () => {
    const url = (id: number | string) => `/user/${userId}/income/${id}`;

    it('400 — incomeId is a string', async () => {
        await agent.get(url('abc')).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — incomeId is negative', async () => {
        await agent.get(url(-1)).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unexpected query param', async () => {
        await agent
            .get(`${url(existingIncomeId)}?foo=bar`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('404 — non-existent incomeId', async () => {
        await agent.get(url(999999999)).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /user/:userId/category/ — body validation', () => {
    const url = () => `/user/${userId}/category/`;

    it('400 — missing categoryName', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ currencyId: 1, iconId: 'icon_x' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing currencyId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ categoryName: 'Test', iconId: 'icon_x' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — missing iconId', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ currencyId: 1, categoryName: 'Test' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — empty body', async () => {
        await agent.post(url()).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — categoryName too short (< 3)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCategory, categoryName: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — categoryName too long (> 128)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCategory, categoryName: 'a'.repeat(129) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — categoryName is a number', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCategory, categoryName: 123 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — iconId too short (< 3)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCategory, iconId: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — iconId too long (> 128)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCategory, iconId: 'a'.repeat(129) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — currencyId is a string', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCategory, currencyId: 'abc' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — extra unknown field', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ ...validCategory, hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unexpected query param', async () => {
        await agent.post(`${url()}?foo=bar`).set('authorization', authorization).send(validCategory).expect(HttpCode.BAD_REQUEST);
    });
});

describe('PATCH /user/:userId/category/:categoryId — body & param validation', () => {
    const url = (id: number | string) => `/user/${userId}/category/${id}`;

    it('400 — empty body', async () => {
        await agent.patch(url(existingCategoryId)).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — categoryName too short', async () => {
        await agent
            .patch(url(existingCategoryId))
            .set('authorization', authorization)
            .send({ categoryName: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — categoryName too long', async () => {
        await agent
            .patch(url(existingCategoryId))
            .set('authorization', authorization)
            .send({ categoryName: 'a'.repeat(129) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — status out of range (< 2)', async () => {
        await agent
            .patch(url(existingCategoryId))
            .set('authorization', authorization)
            .send({ status: 1 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — status out of range (> 3)', async () => {
        await agent
            .patch(url(existingCategoryId))
            .set('authorization', authorization)
            .send({ status: 4 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — status is a string', async () => {
        await agent
            .patch(url(existingCategoryId))
            .set('authorization', authorization)
            .send({ status: 'disabled' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — iconId too short', async () => {
        await agent
            .patch(url(existingCategoryId))
            .set('authorization', authorization)
            .send({ iconId: 'ab' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unknown field in patch body', async () => {
        await agent
            .patch(url(existingCategoryId))
            .set('authorization', authorization)
            .send({ categoryName: 'ValidName', hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — categoryId is a string', async () => {
        await agent
            .patch(url('abc'))
            .set('authorization', authorization)
            .send({ categoryName: 'Test' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — categoryId is negative', async () => {
        await agent
            .patch(url(-1))
            .set('authorization', authorization)
            .send({ categoryName: 'Test' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unexpected query param', async () => {
        await agent
            .patch(`${url(existingCategoryId)}?foo=bar`)
            .set('authorization', authorization)
            .send({ categoryName: 'Test' })
            .expect(HttpCode.BAD_REQUEST);
    });
});

describe('GET /user/:userId/category/:categoryId — param validation', () => {
    const url = (id: number | string) => `/user/${userId}/category/${id}`;

    it('400 — categoryId is a string', async () => {
        await agent.get(url('abc')).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — categoryId is negative', async () => {
        await agent.get(url(-1)).set('authorization', authorization).expect(HttpCode.BAD_REQUEST);
    });

    it('400 — unexpected query param', async () => {
        await agent
            .get(`${url(existingCategoryId)}?foo=bar`)
            .set('authorization', authorization)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('404 — non-existent categoryId', async () => {
        await agent.get(url(999999999)).set('authorization', authorization).expect(HttpCode.NOT_FOUND);
    });
});
