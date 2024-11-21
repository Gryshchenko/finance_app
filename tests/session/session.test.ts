// @ts-nocheck
import { generateRandomEmail, generateRandomPassword, generateSecureRandom } from '../TestsUtils.';
const cookiejar = require('cookiejar');
const request = require('supertest');
require('dotenv').config();
const app = require('../../src/app');
const cookie = require('cookie');

let server;

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);

    server = app.listen(port);
});

afterAll((done) => {
    server.close(done);
});

jest.mock('../../src/middleware/tokenVerify', () => ({
    __esModule: true,
    default: (req, res, next) => {
        next();
    },
    tokenVerifyLogout: (req, res, next) => {
        next();
    },
}));
describe('Session Security Test', () => {
    // it("should not allow access with another user's session", async () => {
    //     const agent1 = request.agent(app);
    //     const agent2 = request.agent(app);

    //     const res1 = await agent1
    //         .post('/register/signup')
    //         .set(
    //             'User-Agent',
    //             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    //         )
    //         .send({ email: generateRandomEmail(), password: generateRandomPassword() })
    //         .expect(200);

    //     const res2 = await agent2
    //         .post('/register/signup')
    //         .set(
    //             'User-Agent',
    //             'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36',
    //         )
    //         .send({ email: generateRandomEmail(), password: generateRandomPassword() })
    //         .expect(200);

    //     const response = await agent2
    //         .get(`/user/${res1.body.data.profile.userId}/profile/`)
    //         .set(
    //             'User-Agent',
    //             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    //         )
    //         .set('authorization', res1.header['authorization']);

    //     expect(response.body).toStrictEqual({ data: {}, errors: [], status: 2 });
    // });
    it('should not allow access with non-existent session', async () => {
        const agent1 = request.agent(app);

        const res1 = await request(app)
            .post('/register/signup')
            .send({ email: generateRandomEmail(), password: generateRandomPassword() })
            .expect(200);

        const fakeSessionId = 's%3AAc4EsOmQCjfakeYtYtqUGfKndukyhy.v%2Bx9gufakeKB42GbwerZA;dsfsdf=sdffsd;dsfdsf=sdfsdf;';
        const cookie = res1.header['set-cookie'][0];
        const newCookie = cookie.replace(
            /session=.*?;/,
            `session=${fakeSessionId} Path=/; Expires=Mon, 18 Nov 2024 15:14:27 GMT; HttpOnly; Secure`,
        );

        const response = await request(app)
            .get(`/user/${res1.body.data.userId}/profile/`)
            .set('Cookie', newCookie)
            .set('authorization', res1.header['authorization']);

        expect(response.body).toStrictEqual({
            data: {},
            errors: [
                {
                    errorCode: 5000,
                },
            ],
            status: 2,
        });
    });
    //
    // it('should expire the session after timeout', async () => {
    //     const agent = request.agent(app);
    //
    //     await agent
    //         .post('/login')
    //         .send({ username: 'testuser' })
    //         .expect(200);
    //
    //     // Имитируем истечение времени сессии
    //     await new Promise((resolve) => setTimeout(resolve, 2000));
    //
    //     const response = await agent
    //         .get('/session')
    //         .expect(401);
    //
    //     expect(response.text).toBe('No session');
    // });
    //
    // it('should not allow session tampering', async () => {
    //     const agent = request.agent(app);
    //
    //     await agent
    //         .post('/login')
    //         .send({ username: 'testuser' })
    //         .expect(200);
    //
    //     const sessionCookie = agent.jar.getCookie('connect.sid', { path: '/' });
    //     const tamperedSessionCookie = sessionCookie.cookieString().replace('s:', 'tampered:');
    //
    //     const response = await request(app)
    //         .get('/session')
    //         .set('Cookie', tamperedSessionCookie)
    //         .expect(401);
    //
    //     expect(response.text).toBe('No session');
    // });
    //
    // it('should handle simultaneous access from different devices', async () => {
    //     const agent1 = request.agent(app);
    //     const agent2 = request.agent(app);
    //
    //     await agent1
    //         .post('/login')
    //         .send({ username: 'testuser' })
    //         .expect(200);
    //
    //     await agent2
    //         .post('/login')
    //         .send({ username: 'testuser' })
    //         .expect(200);
    //
    //     const response1 = await agent1
    //         .get('/session')
    //         .expect(200);
    //
    //     const response2 = await agent2
    //         .get('/session')
    //         .expect(200);
    //
    //     expect(response1.text).toBe('Hello, testuser');
    //     expect(response2.text).toBe('Hello, testuser');
    // });
    //
    // it('should handle session deletion', async () => {
    //     const agent = request.agent(app);
    //
    //     await agent
    //         .post('/login')
    //         .send({ username: 'testuser' })
    //         .expect(200);
    //
    //     // Логика удаления сессии, возможно, через специальный маршрут /logout
    //     await agent
    //         .post('/logout')
    //         .expect(200);
    //
    //     const response = await agent
    //         .get('/session')
    //         .expect(401);
    //
    //     expect(response.text).toBe('No session');
    // });
});
