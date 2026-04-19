import { IDatabaseConnection } from '../src/interfaces/IDatabaseConnection';
import { HttpCode } from 'tenpercent/shared';
import DatabaseConnection from '../src/repositories/DatabaseConnection';
import config from '../src/config/dbConfig';
import { Agent } from 'supertest';
import { LanguageType } from 'tenpercent/shared';
import { UserStatus } from 'tenpercent/shared';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require('crypto');

export function generateSecureRandom() {
    const buffer = crypto.randomBytes(4);
    return buffer.readUInt32BE(0) / (0xffffffff + 1);
}

export function generateRandomString(len = Math.floor(generateSecureRandom() * 10) + 5) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const userNameLength = len;
    let userName = 'test_';

    for (let i = 0; i < userNameLength; i++) {
        userName += chars.charAt(Math.floor(generateSecureRandom() * chars.length));
    }

    return userName;
}

export function generateRandomEmail(len = 10) {
    const domains = ['test.com', 'example.com', 'demo.com'];
    const domain = domains[Math.floor(generateSecureRandom() * domains.length)];

    return `${generateRandomString(len)}@${domain}`;
}

export function generateRandomNumber(min: number, max: number) {
    return crypto.randomInt(min, max + 1);
}

export function generateRandomName(len = 6) {
    return generateRandomString(len);
}

export function generateRandomPassword(len = Math.floor(generateSecureRandom() * 9) + 8) {
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowerChars + upperChars + numbers + specialChars;
    const passwordLength = len;
    let password = '';

    password += lowerChars.charAt(Math.floor(generateSecureRandom() * lowerChars.length));
    password += upperChars.charAt(Math.floor(generateSecureRandom() * upperChars.length));
    password += numbers.charAt(Math.floor(generateSecureRandom() * numbers.length));
    password += specialChars.charAt(Math.floor(generateSecureRandom() * specialChars.length));

    for (let i = password.length; i < passwordLength; i++) {
        password += allChars.charAt(Math.floor(generateSecureRandom() * allChars.length));
    }

    password = password
        .split('')
        .sort(() => 0.5 - generateSecureRandom())
        .join('');

    return password;
}

export async function deleteUserAfterTest(id: number, db: IDatabaseConnection) {
    await db.engine()('daily_accounts_stats').delete().where({ userId: id });
    await db.engine()('daily_categories_stats').delete().where({ userId: id });
    await db.engine()('daily_incomes_stats').delete().where({ userId: id });
    await db.engine()('daily_stats').delete().where({ userId: id });
    await db.engine()('daily_transfer_stats').delete().where({ userId: id });
    await db.engine()('transactions').delete().where({ userId: id });
    await db.engine()('accounts').delete().where({ userId: id });
    await db.engine()('incomes').delete().where({ userId: id });
    await db.engine()('categories').delete().where({ userId: id });
    await db.engine()('profiles').delete().where({ userId: id });
    await db.engine()('email_confirmations').delete().where({ userId: id });
    await db.engine()('usergroups').delete().where({ userId: id });
    await db.engine()('userroles').delete().where({ userId: id });
    await db.engine()('balance').delete().where({ userId: id });
    await db.engine()('users').delete().where({ userId: id });
}

const createUserBase = async ({
    agent,
    password = generateRandomPassword(),
    email = generateRandomEmail(),
    publicName = generateRandomName(),
    locale = LanguageType.US,
    currencyCode = 'USD',
}: {
    agent: Agent;
    password?: string;
    email?: string;
    locale?: LanguageType;
    publicName?: string;
    currencyCode?: string;
}): Promise<{ userId: number; authorization: string; longToken: string; token: string }> => {
    const { body, header } = await agent.post('/register/signup').send({ email, password, locale, publicName, currencyCode });
    const {
        data: { userId, token, tokenLong },
    } = body;
    expect(userId).toEqual(expect.any(Number));
    expect(token).toEqual(expect.any(String));
    expect(header['authorization']).toEqual(expect.any(String));
    return {
        userId,
        authorization: header['authorization'],
        longToken: tokenLong,
        token,
    };
};

export const createUser = async ({
    agent,
    password = generateRandomPassword(),
    email = generateRandomEmail(),
    publicName = generateRandomName(),
    locale = LanguageType.US,
    databaseConnection = new DatabaseConnection(config),
    currencyCode = 'USD',
}: {
    agent: Agent;
    password?: string;
    email?: string;
    locale?: LanguageType;
    publicName?: string;
    databaseConnection?: IDatabaseConnection;
    currencyCode?: string;
}): Promise<{ userId: number; authorization: string; longToken: string }> => {
    const { userId, authorization, longToken } = await createUserBase({
        agent,
        password,
        email,
        publicName,
        locale,
        currencyCode,
    });
    expect(userId).toEqual(expect.any(Number));
    const confirm = await databaseConnection.engine()('email_confirmations').select('*').where({ userId, email }).first();
    const userBefore = await agent.get(`/user/${userId}`).set('authorization', authorization);
    const profileBefore = await agent.get(`/user/${userId}/profile`).set('authorization', authorization);
    expect(userBefore.status).toStrictEqual(HttpCode.FORBIDDEN);
    expect(profileBefore.status).toStrictEqual(HttpCode.FORBIDDEN);

    expect(confirm.confirmationCode).toEqual(expect.any(Number));
    expect(confirm.confirmed).toBe(false);
    const confirmMailResponse = await agent
        .post(`/register/signup/${userId}/email-confirmation/verify`)
        .set('authorization', authorization)
        .send({ confirmationCode: confirm.confirmationCode });

    expect(confirmMailResponse.status).toBe(HttpCode.OK);
    expect(confirmMailResponse.body.data).toStrictEqual({
        confirmationId: expect.any(Number),
    });
    const confirmAfter = await databaseConnection.engine()('email_confirmations').select('*').where({ userId, email }).first();
    expect(confirmAfter.confirmed).toBe(true);
    expect(confirmAfter.email).toStrictEqual(email);
    expect(confirm.confirmationCode).toStrictEqual(confirmAfter.confirmationCode);
    const userAfter = await agent.get(`/user/${userId}`).set('authorization', authorization);
    const profile = await agent.get(`/user/${userId}/profile`).set('authorization', authorization);
    expect(profile.body.data).toStrictEqual({
        profileId: expect.any(Number),
        email,
        publicName,
        locale: expect.any(String),
        currencyId: expect.any(Number),
        userId: expect.any(Number),
    });
    expect(userAfter.body.data).toStrictEqual({
        userId,
        email,
        status: UserStatus.ACTIVE,
    });
    return {
        userId,
        authorization,
        longToken,
    };
};

export const createUserNotVerify = async ({
    agent,
    password = generateRandomPassword(),
    email = generateRandomEmail(),
    publicName = generateRandomName(),
    locale = LanguageType.US,
}: {
    agent: Agent;
    password?: string;
    email?: string;
    locale?: LanguageType;
    publicName?: string;
}): Promise<{ userId: number; authorization: string }> => {
    const { userId, authorization } = await createUserBase({
        agent,
        password,
        email,
        publicName,
        locale,
    });
    return {
        userId,
        authorization,
    };
};

export async function getOverview(agent: any, userId: number, authorization: string) {
    const {
        body: {
            data: { accounts, incomes, categories },
        },
    } = await agent.get(`/user/${userId}/overview/`).set('authorization', authorization).send({}).expect(HttpCode.OK);
    return { accounts, incomes, categories };
}
