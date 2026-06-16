/**
 * Validation tests - Registration routes
 *
 * POST /register/signup
 * POST /register/signup/:userId/email-confirmation/verify
 * POST /register/signup/:userId/email-confirmation/resend
 * GET  /register/signup/:userId/email-confirmation/
 */

import { createUserNotVerify, deleteUserAfterTest, generateSecureRandom } from '../TestsUtils.';
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

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    server = app.listen(port);
    agent = request.agent(server);
});

afterAll((done) => {
    userIds.forEach(async (id) => {
        await deleteUserAfterTest(id, DatabaseConnection.instance(config));
    });
    (server as { close: (cb: () => void) => void }).close(done);
});

// ─── POST /register/signup ───────────────────────────────────────────────────

describe('POST /register/signup - body validation', () => {
    const url = '/register/signup';

    const valid = {
        email: () => `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`,
        password: 'ValidPass1!',
        publicName: 'TestUser',
        currencyCode: 'USD',
    };

    // required fields
    it('400 - missing email', async () => {
        await agent
            .post(url)
            .send({ password: valid.password, publicName: valid.publicName, currencyCode: valid.currencyCode })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - missing password', async () => {
        await agent
            .post(url)
            .send({ email: valid.email(), publicName: valid.publicName, currencyCode: valid.currencyCode })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - missing publicName', async () => {
        await agent
            .post(url)
            .send({ email: valid.email(), password: valid.password, currencyCode: valid.currencyCode })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - missing currencyCode', async () => {
        await agent
            .post(url)
            .send({ email: valid.email(), password: valid.password, publicName: valid.publicName })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - empty body', async () => {
        await agent.post(url).send({}).expect(HttpCode.BAD_REQUEST);
    });

    // email
    it('400 - email not valid format', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: 'not-email' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - email exceeds 150 chars', async () => {
        const longEmail = `${'a'.repeat(150)}@example.com`;
        await agent
            .post(url)
            .send({ ...valid, email: longEmail })
            .expect(HttpCode.BAD_REQUEST);
    });

    // password
    it('400 - weak password (no uppercase/digit/special)', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: valid.email(), password: 'weakpassword' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - password too short (< 5 chars)', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: valid.email(), password: 'A1!' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - password too long (> 30 chars)', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: valid.email(), password: `ValidPass1!${'a'.repeat(25)}` })
            .expect(HttpCode.BAD_REQUEST);
    });

    // publicName
    it('400 - publicName too short (< 2 chars)', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: valid.email(), publicName: 'a' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - publicName too long (> 40 chars)', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: valid.email(), publicName: 'a'.repeat(41) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - publicName is a number', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: valid.email(), publicName: 123 })
            .expect(HttpCode.BAD_REQUEST);
    });

    // locale (optional)
    it('400 - locale has invalid format (not xx-XX)', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: valid.email(), locale: 'english' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - locale is too short', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: valid.email(), locale: 'en' })
            .expect(HttpCode.BAD_REQUEST);
    });

    // currencyCode
    it('400 - currencyCode too long (> 10 chars)', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: valid.email(), currencyCode: 'a'.repeat(11) })
            .expect(HttpCode.BAD_REQUEST);
    });

    // unknown fields
    it('400 - unknown extra field in body', async () => {
        await agent
            .post(url)
            .send({ ...valid, email: valid.email(), hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    // query string
    it('400 - unexpected query param', async () => {
        await agent
            .post(`${url}?foo=bar`)
            .send({ ...valid, email: valid.email() })
            .expect(HttpCode.BAD_REQUEST);
    });
});

// ─── POST /register/signup/:userId/email-confirmation/verify ─────────────────

describe('POST /register/signup/:userId/email-confirmation/verify - validation', () => {
    const url = (id: number | string) => `/register/signup/${id}/email-confirmation/verify`;

    let userId: number;
    let authorization: string;
    let confirmationCode: number;

    beforeAll(async () => {
        const db = new DatabaseConnection(config);
        const localAgent = request.agent(server);
        const email = `verif_${Date.now()}@example.com`;
        const result = await createUserNotVerify({ agent: localAgent, email });
        userId = result.userId;
        authorization = result.authorization;
        userIds.push(userId);

        const row = await db.engine()('email_confirmations').where({ userId }).first();
        confirmationCode = row.confirmationCode;
    });

    // confirmationCode
    it('400 - missing confirmationCode', async () => {
        await agent.post(url(userId)).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - confirmationCode is a string', async () => {
        await agent
            .post(url(userId))
            .set('authorization', authorization)
            .send({ confirmationCode: 'abcdefgh' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - confirmationCode less than 8 digits', async () => {
        await agent
            .post(url(userId))
            .set('authorization', authorization)
            .send({ confirmationCode: 1234567 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - confirmationCode more than 8 digits', async () => {
        await agent
            .post(url(userId))
            .set('authorization', authorization)
            .send({ confirmationCode: 123456789 })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - wrong confirmationCode value (8 digits but incorrect)', async () => {
        const wrong = confirmationCode === 12345678 ? 12345679 : 12345678;
        await agent
            .post(url(userId))
            .set('authorization', authorization)
            .send({ confirmationCode: wrong })
            .expect(HttpCode.BAD_REQUEST);
    });

    // path param :userId
    it('400 - userId is a string', async () => {
        await agent.post(url('abc')).set('authorization', authorization).send({ confirmationCode }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - userId is negative', async () => {
        await agent.post(url(-1)).set('authorization', authorization).send({ confirmationCode }).expect(HttpCode.BAD_REQUEST);
    });

    // query string
    it('400 - unexpected query param', async () => {
        await agent
            .post(`${url(userId)}?foo=bar`)
            .set('authorization', authorization)
            .send({ confirmationCode })
            .expect(HttpCode.BAD_REQUEST);
    });
});
