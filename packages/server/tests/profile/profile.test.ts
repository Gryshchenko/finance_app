import { closeTestApp, createUser, createUserNotVerify, deleteUserAfterTest, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode, LanguageType } from 'tenpercent/shared';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

let server: never;
let userIds: number[] = [];

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-expect-error is necessary
    server = app.listen(port);
});

afterAll(async () => {
    await closeTestApp(server, userIds);
});

describe('Profile', () => {
    describe('GET', () => {
        it('should return correct profile shape for a verified user', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const publicName = 'TestProfile';
            const locale = LanguageType.US;

            const { userId, authorization } = await createUser({
                agent,
                databaseConnection,
                publicName,
                locale,
            });
            userIds.push(userId);

            const { body, status } = await agent.get(`/user/${userId}/profile`).set('authorization', authorization);

            expect(status).toBe(HttpCode.OK);
            expect(body.data).toStrictEqual({
                profileId: expect.any(Number),
                publicName,
                locale,
                currencyCode: expect.any(String),
                email: expect.any(String),
                userId: expect.any(Number),
            });
        });

        it('should return publicName and locale that match registration data', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const publicName = 'UniqueNameDE';
            const locale = LanguageType.DE;

            const { userId, authorization } = await createUser({
                agent,
                databaseConnection,
                publicName,
                locale,
            });
            userIds.push(userId);

            const {
                body: { data },
            } = await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);

            expect(data.publicName).toStrictEqual(publicName);
            expect(data.locale).toStrictEqual(locale);
        });

        it('should return 403 for an unverified user', async () => {
            const agent = request.agent(server);

            const { userId, authorization } = await createUserNotVerify({ agent });
            userIds.push(userId);

            await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.FORBIDDEN);
        });

        it('should return 401 when authorization header is missing', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            await agent.get(`/user/${userId}/profile`).expect(HttpCode.UNAUTHORIZED);
        });

        it('should return 400 for unknown query params', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            for (const query of ['?unknown=value', '?locale=en-US', '?publicName=test']) {
                await agent
                    .get(`/user/${userId}/profile${query}`)
                    .set('authorization', authorization)
                    .expect(HttpCode.BAD_REQUEST);
            }
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PATCH /user/:userId/profile
    // ─────────────────────────────────────────────────────────────────────────

    describe('PATCH', () => {
        it('should return 400 for an empty body', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            await agent
                .patch(`/user/${userId}/profile`)
                .set('authorization', authorization)
                .send({})
                .expect(HttpCode.BAD_REQUEST);
        });

        it('should return 204 when updating locale', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            await agent
                .patch(`/user/${userId}/profile`)
                .set('authorization', authorization)
                .send({ locale: LanguageType.DE })
                .expect(HttpCode.NO_CONTENT);

            const {
                body: { data },
            } = await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);

            expect(data.locale).toBe(LanguageType.DE);
        });

        it('should return 204 when updating publicName', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            await agent
                .patch(`/user/${userId}/profile`)
                .set('authorization', authorization)
                .send({ publicName: 'UpdatedName' })
                .expect(HttpCode.NO_CONTENT);

            const {
                body: { data },
            } = await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);

            expect(data.publicName).toBe('UpdatedName');
        });

        it('should return 204 when updating currencyCode', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            const {
                body: { data: profile },
            } = await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);

            await agent
                .patch(`/user/${userId}/profile`)
                .set('authorization', authorization)
                .send({ currencyCode: profile.currencyCode })
                .expect(HttpCode.NO_CONTENT);
        });

        it('should return 204 when updating all fields at once', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            const {
                body: { data: profile },
            } = await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);

            await agent
                .patch(`/user/${userId}/profile`)
                .set('authorization', authorization)
                .send({ locale: LanguageType.UA, publicName: 'AllFields', currencyCode: profile.currencyCode })
                .expect(HttpCode.NO_CONTENT);

            const {
                body: { data: updated },
            } = await agent.get(`/user/${userId}/profile`).set('authorization', authorization).expect(HttpCode.OK);

            expect(updated.locale).toBe(LanguageType.UA);
            expect(updated.publicName).toBe('AllFields');
        });

        it('should return 400 for invalid locale format', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            for (const locale of ['en', 'english', 'en_US', '12-34', 'toolonglocale']) {
                await agent
                    .patch(`/user/${userId}/profile`)
                    .set('authorization', authorization)
                    .send({ locale })
                    .expect(HttpCode.BAD_REQUEST);
            }
        });

        it('should return 400 for publicName that is too short', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            await agent
                .patch(`/user/${userId}/profile`)
                .set('authorization', authorization)
                .send({ publicName: 'AB' })
                .expect(HttpCode.BAD_REQUEST);
        });

        it('should return 400 when body contains unknown properties', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            for (const body of [
                { unknown: 'value' },
                { foo: 1, bar: 2 },
                { confirmationCode: '12345678' },
                { locale: LanguageType.UA, extra: true },
            ]) {
                await agent
                    .patch(`/user/${userId}/profile`)
                    .set('authorization', authorization)
                    .send(body)
                    .expect(HttpCode.BAD_REQUEST);
            }
        });

        it('should return 400 for unknown query params', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId, authorization } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            for (const query of ['?unknown=value', '?locale=en-US', '?publicName=test']) {
                await agent
                    .patch(`/user/${userId}/profile${query}`)
                    .set('authorization', authorization)
                    .send({})
                    .expect(HttpCode.BAD_REQUEST);
            }
        });

        it('should return 403 for an unverified user', async () => {
            const agent = request.agent(server);

            const { userId, authorization } = await createUserNotVerify({ agent });
            userIds.push(userId);

            await agent
                .patch(`/user/${userId}/profile`)
                .set('authorization', authorization)
                .send({ locale: LanguageType.DE })
                .expect(HttpCode.FORBIDDEN);
        });

        it('should return 401 when authorization header is missing', async () => {
            const agent = request.agent(server);
            const databaseConnection = DatabaseConnection.instance(config);

            const { userId } = await createUser({ agent, databaseConnection });
            userIds.push(userId);

            await agent.patch(`/user/${userId}/profile`).send({ locale: LanguageType.DE }).expect(HttpCode.UNAUTHORIZED);
        });
    });
});
