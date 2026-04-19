import {
    createUser,
    deleteUserAfterTest,
    generateRandomEmail,
    generateRandomName,
    generateRandomPassword,
    generateSecureRandom,
} from '../TestsUtils.';
import { ResponseStatusType } from 'tenpercent/shared';
import { HttpCode } from 'tenpercent/shared';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { LanguageType } from 'tenpercent/shared';
import { UserStatus } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

let server: never;

const userIds: number[] = [];

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);

    // @ts-expect-error is necessary
    server = app.listen(port);
});

afterAll((done) => {
    userIds.forEach(async (id) => {
        await deleteUserAfterTest(id, DatabaseConnection.instance(config));
    });
    // @ts-expect-error is necessary
    server.close(done);
});

describe('POST /auth', () => {
    let agent: any;
    let userId: number;
    let email: string;
    let password: string;
    let authorization: string;
    let longToken: string;
    let databaseConnection: DatabaseConnection;

    beforeAll(async () => {
        databaseConnection = new DatabaseConnection(config);
        agent = request.agent(server);
        password = generateRandomPassword();
        email = generateRandomEmail();
        const publicName = generateRandomName();
        const result = await createUser({
            password,
            email,
            publicName,
            locale: LanguageType.US,
            agent,
            databaseConnection,
        });
        userId = result.userId as number;
        authorization = result.authorization;
        longToken = result.longToken;
        userIds.push(userId);
    });

    it('long token refresh', async () => {
        const verifyResponse1 = await agent.post(`/auth/${userId}/refresh`);
        expect(verifyResponse1.status).toBe(HttpCode.BAD_REQUEST);
        const verifyResponse2 = await agent.post(`/auth/${userId}/refresh`).send({
            token: longToken,
        });
        expect(verifyResponse2.status).toBe(HttpCode.OK);
        expect(verifyResponse2.body.data.token).toStrictEqual(expect.any(String));
        const verifyResponse3 = await agent.post(`/auth/${userId}/refresh`).send({
            token: authorization.split(' ')[1],
        });
        expect(verifyResponse3.status).toBe(HttpCode.BAD_REQUEST);
        expect(verifyResponse3.body).toStrictEqual({
            status: ResponseStatusType.INTERNAL,
            data: {},
            errors: [{ errorCode: ErrorCode.TOKEN_LONG_INVALID_ERROR }],
        });
    });
    it('login, logout, verify, fake token', async () => {
        // verify initial token
        const verifyResponse1 = await agent.get(`/auth/${userId}/verify`).set('authorization', authorization);
        expect(verifyResponse1.status).toBe(HttpCode.OK);

        // logout
        const logOutResponse = await agent.post(`/auth/logout`).set('authorization', authorization);
        expect(logOutResponse.status).toBe(HttpCode.OK);

        // verify after logout
        const verifyResponse2 = await agent.get(`/auth/${userId}/verify`).set('authorization', authorization);
        expect(verifyResponse2.status).toBe(HttpCode.UNAUTHORIZED);

        // login again
        const loginResponse = await agent.post(`/auth/login`).send({ email, password });
        expect(loginResponse.status).toBe(HttpCode.OK);
        expect(loginResponse.body).toStrictEqual({
            status: ResponseStatusType.OK,
            data: {
                userId,
                email,
                token: expect.any(String),
                tokenLong: expect.any(String),
                status: UserStatus.ACTIVE,
            },
            errors: [],
        });

        // fake token
        const fakeNewToken = jwt.sign({ sub: String(userId) }, 'wrong-secret', {
            algorithm: 'HS384',
            expiresIn: '1h',
            issuer: 'test',
            audience: 'test.net',
        });
        const verifyResponse4 = await agent.get(`/auth/${userId}/verify`).set('authorization', fakeNewToken);
        expect(verifyResponse4.status).toBe(HttpCode.UNAUTHORIZED);
    });
    it('should fail verify with expired token', async () => {
        const expiredToken = jwt.sign({ sub: userId }, 'secret', { expiresIn: '-1s' });
        const response = await agent.get(`/auth/${userId}/verify`).set('authorization', expiredToken);
        expect(response.status).toBe(HttpCode.UNAUTHORIZED);
    });

    it('should fail verify with malformed token', async () => {
        const response = await agent.get(`/auth/${userId}/verify`).set('authorization', 'malformed.token.here');
        expect(response.status).toBe(HttpCode.UNAUTHORIZED);
    });

    it('should fail verify with token of another user', async () => {
        const otherUser = await createUser({
            password: generateRandomPassword(),
            email: generateRandomEmail(),
            publicName: generateRandomName(),
            locale: LanguageType.US,
            agent,
            databaseConnection,
        });
        const response = await agent.get(`/auth/${userId}/verify`).set('authorization', otherUser.authorization);
        expect(response.status).toBe(HttpCode.FORBIDDEN);
        const response1 = await agent.get(`/auth/${otherUser.userId}/verify`).set('authorization', otherUser.authorization);
        expect(response1.status).toBe(HttpCode.OK);
        const profileOrigin = await agent.get(`/user/${userId}/profile`).set('authorization', otherUser.authorization);
        expect(profileOrigin.status).toBe(HttpCode.FORBIDDEN);
    });

    it('should return UNAUTHORIZED on repeated logout', async () => {
        await agent.post('/auth/logout').set('authorization', authorization);
        const response = await agent.post('/auth/logout').set('authorization', authorization);
        expect(response.status).toBe(HttpCode.UNAUTHORIZED);
    });

    it('should return UNAUTHORIZED on empty authorization header', async () => {
        const response = await agent.get(`/auth/${userId}/verify`).set('authorization', '');
        expect(response.status).toBe(HttpCode.UNAUTHORIZED);
    });
});
