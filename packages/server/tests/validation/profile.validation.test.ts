/**
 * Validation tests - Profile routes
 *
 * PATCH /user/:userId/profile/
 * POST  /user/:userId/profile/email-change
 * POST  /user/:userId/profile/email-change/verify
 * POST  /user/:userId/profile/email-change/resend
 * POST  /user/:userId/profile/password-change
 * POST  /user/:userId/profile/password-change/verify
 * POST  /user/:userId/profile/password-change/resend
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
const userPassword = 'ValidPass1!';

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    server = app.listen(port);
    agent = request.agent(server);
    const db = new DatabaseConnection(config);
    const result = await createUser({ agent, password: userPassword, databaseConnection: db });
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

// ─── PATCH /user/:userId/profile/ ────────────────────────────────────────────

describe('PATCH /user/:userId/profile/ - body validation', () => {
    const url = () => `/user/${userId}/profile/`;

    // locale
    it('400 - locale invalid format (not xx-XX)', async () => {
        await agent.patch(url()).set('authorization', authorization).send({ locale: 'english' }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - locale too short (< 4)', async () => {
        await agent.patch(url()).set('authorization', authorization).send({ locale: 'en' }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - locale too long (> 6)', async () => {
        await agent.patch(url()).set('authorization', authorization).send({ locale: 'en-USABC' }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - locale is a number', async () => {
        await agent.patch(url()).set('authorization', authorization).send({ locale: 123456 }).expect(HttpCode.BAD_REQUEST);
    });

    // currencyId
    it('400 - currencyId is a string', async () => {
        await agent.patch(url()).set('authorization', authorization).send({ currencyId: 'abc' }).expect(HttpCode.BAD_REQUEST);
    });

    // publicName
    it('400 - publicName too short (< 3)', async () => {
        await agent.patch(url()).set('authorization', authorization).send({ publicName: 'ab' }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - publicName too long (> 128)', async () => {
        await agent
            .patch(url())
            .set('authorization', authorization)
            .send({ publicName: 'a'.repeat(129) })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - publicName is a number', async () => {
        await agent.patch(url()).set('authorization', authorization).send({ publicName: 99999 }).expect(HttpCode.BAD_REQUEST);
    });

    // unknown field
    it('400 - unknown field in body', async () => {
        await agent
            .patch(url())
            .set('authorization', authorization)
            .send({ publicName: 'ValidName', hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    // query string
    it('400 - unexpected query param', async () => {
        await agent
            .patch(`${url()}?foo=bar`)
            .set('authorization', authorization)
            .send({ publicName: 'ValidName' })
            .expect(HttpCode.BAD_REQUEST);
    });

    // valid case
    it('204 - valid patch with publicName only', async () => {
        await agent.patch(url()).set('authorization', authorization).send({ publicName: 'NewName' }).expect(HttpCode.NO_CONTENT);
    });
});

// ─── POST /user/:userId/profile/email-change ──────────────────────────────────

describe('POST /user/:userId/profile/email-change - body validation', () => {
    const url = () => `/user/${userId}/profile/email-change`;

    it('400 - missing newEmail', async () => {
        await agent.post(url()).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - newEmail not a valid email', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ newEmail: 'not-an-email' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - newEmail exceeds 100 chars', async () => {
        const longEmail = `${'a'.repeat(95)}@b.com`;
        await agent.post(url()).set('authorization', authorization).send({ newEmail: longEmail }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - newEmail is a number', async () => {
        await agent.post(url()).set('authorization', authorization).send({ newEmail: 12345 }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unknown field in body', async () => {
        const newEmail = `change_${Date.now()}@example.com`;
        await agent.post(url()).set('authorization', authorization).send({ newEmail, hack: true }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unexpected query param', async () => {
        await agent
            .post(`${url()}?foo=bar`)
            .set('authorization', authorization)
            .send({ newEmail: `ok_${Date.now()}@example.com` })
            .expect(HttpCode.BAD_REQUEST);
    });
});

// ─── POST /user/:userId/profile/email-change/resend ───────────────────────────

describe('POST /user/:userId/profile/email-change/resend - body validation', () => {
    const url = () => `/user/${userId}/profile/email-change/resend`;

    it('400 - missing confirmationId', async () => {
        await agent.post(url()).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - confirmationId is a string', async () => {
        await agent.post(url()).set('authorization', authorization).send({ confirmationId: 'abc' }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - confirmationId is zero (< 1)', async () => {
        await agent.post(url()).set('authorization', authorization).send({ confirmationId: 0 }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unknown field in body', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ confirmationId: 1, hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unexpected query param', async () => {
        await agent
            .post(`${url()}?foo=bar`)
            .set('authorization', authorization)
            .send({ confirmationId: 1 })
            .expect(HttpCode.BAD_REQUEST);
    });
});

// ─── POST /user/:userId/profile/password-change ───────────────────────────────

describe('POST /user/:userId/profile/password-change - body validation', () => {
    const url = () => `/user/${userId}/profile/password-change`;

    it('400 - missing password', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ newPassword: 'ValidNew1!' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - missing newPassword', async () => {
        await agent.post(url()).set('authorization', authorization).send({ password: userPassword }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - empty body', async () => {
        await agent.post(url()).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - newPassword too weak', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ password: userPassword, newPassword: 'weakonly' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - newPassword too short (< 5)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ password: userPassword, newPassword: 'A1!' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - newPassword too long (> 30)', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ password: userPassword, newPassword: `ValidPass1!${'a'.repeat(25)}` })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - password is a number', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ password: 123456, newPassword: 'ValidNew1!' })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unknown field in body', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ password: userPassword, newPassword: 'ValidNew1!', hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unexpected query param', async () => {
        await agent
            .post(`${url()}?foo=bar`)
            .set('authorization', authorization)
            .send({ password: userPassword, newPassword: 'ValidNew1!' })
            .expect(HttpCode.BAD_REQUEST);
    });
});

// ─── POST /user/:userId/profile/password-change/resend ────────────────────────

describe('POST /user/:userId/profile/password-change/resend - body validation', () => {
    const url = () => `/user/${userId}/profile/password-change/resend`;

    it('400 - missing confirmationId', async () => {
        await agent.post(url()).set('authorization', authorization).send({}).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - confirmationId is a string', async () => {
        await agent.post(url()).set('authorization', authorization).send({ confirmationId: 'abc' }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - confirmationId is 0', async () => {
        await agent.post(url()).set('authorization', authorization).send({ confirmationId: 0 }).expect(HttpCode.BAD_REQUEST);
    });

    it('400 - unknown field in body', async () => {
        await agent
            .post(url())
            .set('authorization', authorization)
            .send({ confirmationId: 1, hack: true })
            .expect(HttpCode.BAD_REQUEST);
    });
});
