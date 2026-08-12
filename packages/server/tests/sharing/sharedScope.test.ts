import { HttpCode, StatsPeriod, StatsScope, Time } from '@tenpercent/shared';

import config from '../../src/config/dbConfig';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import { closeTestApp, createUser, generateRandomEmail, generateSecureRandom } from '../TestsUtils.';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

let server: never;
const userIds: number[] = [];
const db = DatabaseConnection.instance(config);

let ownerId: number;
let ownerAuth: string;

let memberId: number;
let memberAuth: string;
let memberEmail: string;

/** Never connected to anyone: `scope=shared` must be empty for them. */
let outsiderId: number;
let outsiderAuth: string;

let sharedAccountId: number;
let sharedCategoryId: number;
let ownerPrivateCategoryId: number;
let memberOwnCategoryId: number;
let memberAccountId: number;

let userGroupId: number;
let connectionId: number;

const SHARED_ACCOUNT_AMOUNT = 500;
const MEMBER_ACCOUNT_AMOUNT = 1000;

const agent = () => request.agent(server);

type Item = { id: number; type: string; name: string; isShared: boolean };

const createAccount = (uid: number, auth: string, accountName: string, amount: number) =>
    agent()
        .post(`/user/${uid}/account`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', accountName, amount, iconId: 'wallet' })
        .expect(HttpCode.OK);

const createCategory = (uid: number, auth: string, categoryName: string) =>
    agent()
        .post(`/user/${uid}/category`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', categoryName, iconId: 'wallet' })
        .expect(HttpCode.OK);

const period = { from: Time.toMonthStart(Time.getISODateNowUTC()) as string, to: Time.getISODateNowUTC() as string };

const scopeQuery = (scope?: StatsScope) => (scope ? `&scope=${scope}` : '');

const categoriesStats = (uid: number, auth: string, scope?: StatsScope) =>
    agent()
        .get(`/user/${uid}/categories/stats?from=${period.from}&to=${period.to}&period=${StatsPeriod.Month}${scopeQuery(scope)}`)
        .set('authorization', auth);

const summary = (uid: number, auth: string, scope?: StatsScope) =>
    agent()
        .get(`/user/${uid}/stats/summary?from=${period.from}&to=${period.to}&period=${StatsPeriod.Month}${scopeQuery(scope)}`)
        .set('authorization', auth);

const balance = (uid: number, auth: string, scope?: StatsScope) =>
    agent()
        .get(`/user/${uid}/balance${scope ? `?scope=${scope}` : ''}`)
        .set('authorization', auth);

// Structural, not `ICategoryStats`: the shared package emits non-relative imports in its
// declarations, so the inherited members of ICategory are not visible from here.
const categoryIdsOf = (response: { body: { data: { items: { categoryId: number }[] } } }): number[] =>
    response.body.data.items.map((item) => item.categoryId);

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-expect-error listen returns a Server the util accepts as never
    server = app.listen(port);

    const owner = await createUser({ agent: agent(), databaseConnection: db });
    ownerId = owner.userId;
    ownerAuth = owner.authorization;
    userIds.push(ownerId);

    memberEmail = generateRandomEmail();
    const member = await createUser({ agent: agent(), email: memberEmail, databaseConnection: db });
    memberId = member.userId;
    memberAuth = member.authorization;
    userIds.push(memberId);

    const outsider = await createUser({ agent: agent(), databaseConnection: db });
    outsiderId = outsider.userId;
    outsiderAuth = outsider.authorization;
    userIds.push(outsiderId);

    sharedAccountId = (await createAccount(ownerId, ownerAuth, 'Owner shared account', SHARED_ACCOUNT_AMOUNT)).body.data
        .accountId;
    sharedCategoryId = (await createCategory(ownerId, ownerAuth, 'Owner shared category')).body.data.categoryId;
    ownerPrivateCategoryId = (await createCategory(ownerId, ownerAuth, 'Owner private category')).body.data.categoryId;

    memberAccountId = (await createAccount(memberId, memberAuth, 'Member own account', MEMBER_ACCOUNT_AMOUNT)).body.data
        .accountId;
    memberOwnCategoryId = (await createCategory(memberId, memberAuth, 'Member own category')).body.data.categoryId;

    const items = (await agent().get(`/user/${ownerId}/groups/shareable-items`).set('authorization', ownerAuth)).body
        .data as Item[];
    const created = await agent()
        .post(`/user/${ownerId}/group`)
        .set('authorization', ownerAuth)
        .send({
            groupName: 'Household',
            groupSharedItems: items.map((it) => ({
                ...it,
                isShared:
                    (it.type === 'account' && it.id === sharedAccountId) ||
                    (it.type === 'category' && it.id === sharedCategoryId),
            })),
        })
        .expect(HttpCode.OK);
    userGroupId = created.body.data.userGroupId;

    await agent()
        .post(`/user/${ownerId}/sharing/invite`)
        .set('authorization', ownerAuth)
        .send({ email: memberEmail, userGroupId })
        .expect(HttpCode.OK);
    const sent = await agent().get(`/user/${ownerId}/sharing/connections/sent`).set('authorization', ownerAuth);
    connectionId = sent.body.data[0].connectionId;
    await agent()
        .post(`/user/${memberId}/sharing/connection/${connectionId}/accept`)
        .set('authorization', memberAuth)
        .expect(HttpCode.NO_CONTENT);
});

afterAll(async () => {
    await db.engine()('transactions').whereIn('userId', userIds).delete();
    await db.engine()('groupshareditem').whereIn('userId', userIds).delete();
    await db.engine()('userconnections').whereIn('ownerUserId', userIds).orWhereIn('memberUserId', userIds).delete();
    await closeTestApp(server, userIds);
});

describe('Stats scope - category stats', () => {
    it('defaults to own + shared, unchanged from before the parameter existed', async () => {
        const ids = categoryIdsOf(await categoriesStats(memberId, memberAuth).expect(HttpCode.OK));

        expect(ids).toContain(memberOwnCategoryId);
        expect(ids).toContain(sharedCategoryId);
        expect(ids).not.toContain(ownerPrivateCategoryId);
    });

    it('scope=own drops everything shared in by other members', async () => {
        const ids = categoryIdsOf(await categoriesStats(memberId, memberAuth, StatsScope.Own).expect(HttpCode.OK));

        expect(ids).toContain(memberOwnCategoryId);
        expect(ids).not.toContain(sharedCategoryId);
    });

    it('scope=shared keeps only what lives in the group', async () => {
        const ids = categoryIdsOf(await categoriesStats(memberId, memberAuth, StatsScope.Shared).expect(HttpCode.OK));

        expect(ids).toContain(sharedCategoryId);
        expect(ids).not.toContain(memberOwnCategoryId);
        expect(ids).not.toContain(ownerPrivateCategoryId);
    });

    it("scope=shared includes the owner's own item because they shared it themselves", async () => {
        const ids = categoryIdsOf(await categoriesStats(ownerId, ownerAuth, StatsScope.Shared).expect(HttpCode.OK));

        expect(ids).toContain(sharedCategoryId);
        expect(ids).not.toContain(ownerPrivateCategoryId);
    });

    it('scope=shared is empty for a user connected to nobody', async () => {
        const ids = categoryIdsOf(await categoriesStats(outsiderId, outsiderAuth, StatsScope.Shared).expect(HttpCode.OK));

        expect(ids).toHaveLength(0);
    });
});

describe('Stats scope - balance', () => {
    it('defaults to own accounts only, so shared money never inflates net worth', async () => {
        const { balance: amount } = (await balance(memberId, memberAuth).expect(HttpCode.OK)).body.data;

        expect(amount).toBe(MEMBER_ACCOUNT_AMOUNT);
    });

    it('scope=own matches the default', async () => {
        const { balance: amount } = (await balance(memberId, memberAuth, StatsScope.Own).expect(HttpCode.OK)).body.data;

        expect(amount).toBe(MEMBER_ACCOUNT_AMOUNT);
    });

    it('scope=shared sums the accounts in the group instead', async () => {
        const { balance: amount } = (await balance(memberId, memberAuth, StatsScope.Shared).expect(HttpCode.OK)).body.data;

        // Only the owner's account was shared; the member's own one was not.
        expect(amount).toBe(SHARED_ACCOUNT_AMOUNT);
    });

    it('scope=shared is zero for a user connected to nobody', async () => {
        const { balance: amount } = (await balance(outsiderId, outsiderAuth, StatsScope.Shared).expect(HttpCode.OK)).body.data;

        expect(amount).toBe(0);
    });
});

describe('Stats scope - validation', () => {
    it.each([
        ['summary', () => summary(memberId, memberAuth, 'everything' as StatsScope)],
        ['category stats', () => categoriesStats(memberId, memberAuth, 'everything' as StatsScope)],
        ['balance', () => balance(memberId, memberAuth, 'everything' as StatsScope)],
    ])('%s rejects an unknown scope instead of falling back', async (_name, call) => {
        await call().expect(HttpCode.BAD_REQUEST);
    });

    it('rejects a scope that is not a plain string', async () => {
        await agent()
            .get(`/user/${memberId}/categories/stats?from=${period.from}&to=${period.to}&period=${StatsPeriod.Month}&scope[]=own`)
            .set('authorization', memberAuth)
            .expect(HttpCode.BAD_REQUEST);
    });

    it('an outsider cannot reach another user data through the parameter', async () => {
        await agent()
            .get(`/user/${ownerId}/balance?scope=${StatsScope.Shared}`)
            .set('authorization', outsiderAuth)
            .expect(HttpCode.FORBIDDEN);
    });
});
