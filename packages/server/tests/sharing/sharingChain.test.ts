import { HttpCode, StatsPeriod, StatsScope } from '@tenpercent/shared';

import config from '../../src/config/dbConfig';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import { closeTestApp, createUser, generateRandomEmail, generateSecureRandom } from '../TestsUtils.';
import { createExpenseTransaction, createIncomeTransaction } from '../transactions/TransactionsTestUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

/**
 * Five users, two connections, one open question: does sharing leak along the chain?
 *
 *      A <--> B <--> C          D        E
 *
 * A and B are connected, B and C are connected, A and C are not. Every user shares one
 * account, one category and one income into a group and keeps a second category private.
 * B is the bridge: it may see both sides, while A must never learn that C exists (and the
 * other way round). D and E are connected to nobody - they own a group full of shared
 * items too, which must stay invisible because a group without a connection shares with
 * no one.
 *
 * Seed amounts and transaction amounts are unique per user, so every total below names
 * exactly who contributed to it:
 *
 *      user   account   income = expense
 *      A        100           10
 *      B        200           20
 *      C        300           30
 *      D        400           40
 *      E        500           50
 *
 * Income and expense are equal, so an account ends the month exactly where it started and
 * the balance figures stay readable.
 */

let server: never;
const userIds: number[] = [];
const db = DatabaseConnection.instance(config);

const agent = () => request.agent(server);

// One month holds every transaction, so a single month window sees all of them.
const TX_DATE = '2025-12-15T11:00:00.000Z';
const FROM = '2025-12-01T00:00:00.000Z';
const TO = '2025-12-31T00:00:00.000Z';

type Item = { id: number; type: string; name: string; isShared: boolean };

interface IPerson {
    label: string;
    userId: number;
    auth: string;
    email: string;
    /** Shared into the person's own group. */
    accountId: number;
    categoryId: number;
    incomeId: number;
    /** Deliberately left out of the group. */
    privateCategoryId: number;
    userGroupId: number;
    /** Starting amount of `accountId`; also the expected `scope=own` balance. */
    seed: number;
    /** Amount moved in and out during TX_DATE. */
    flow: number;
}

let A: IPerson;
let B: IPerson;
let C: IPerson;
let D: IPerson;
let E: IPerson;

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

const createIncome = (uid: number, auth: string, incomeName: string) =>
    agent()
        .post(`/user/${uid}/income`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', incomeName, iconId: 'bnb' })
        .expect(HttpCode.OK);

const idsOf = (rows: Record<string, number>[], key: string): number[] => rows.map((row) => row[key]);

const listedIds = async (person: IPerson, path: 'accounts' | 'categories' | 'incomes', key: string): Promise<number[]> => {
    const { body } = await agent().get(`/user/${person.userId}/${path}`).set('authorization', person.auth).expect(HttpCode.OK);
    return idsOf(body.data, key);
};

const scopeQuery = (scope?: StatsScope) => (scope ? `&scope=${scope}` : '');

const categoryStatsIds = async (person: IPerson, scope?: StatsScope): Promise<number[]> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/categories/stats?from=${FROM}&to=${TO}&period=${StatsPeriod.Month}${scopeQuery(scope)}`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return idsOf(body.data.items, 'categoryId');
};

const balanceOf = async (person: IPerson, scope?: StatsScope): Promise<number> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/balance${scope ? `?scope=${scope}` : ''}`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return body.data.balance;
};

const summaryOf = async (person: IPerson, scope?: StatsScope): Promise<{ income_total: number; expense_total: number }> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/stats/summary?from=${FROM}&to=${TO}&period=${StatsPeriod.Month}${scopeQuery(scope)}`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return body.data;
};

/**
 * Creates a user with the item set described at the top of the file, shares three of the
 * four items into a fresh group and moves `flow` in and back out of the account.
 */
const setupPerson = async (label: string, seed: number, flow: number): Promise<IPerson> => {
    const email = generateRandomEmail();
    const { userId, authorization } = await createUser({ agent: agent(), email, databaseConnection: db });
    userIds.push(userId);

    const accountId = (await createAccount(userId, authorization, `${label} shared account`, seed)).body.data.accountId;
    const categoryId = (await createCategory(userId, authorization, `${label} shared category`)).body.data.categoryId;
    const incomeId = (await createIncome(userId, authorization, `${label} shared income`)).body.data.incomeId;
    const privateCategoryId = (await createCategory(userId, authorization, `${label} private category`)).body.data.categoryId;

    const items = (await agent().get(`/user/${userId}/groups/shareable-items`).set('authorization', authorization)).body
        .data as Item[];
    const group = await agent()
        .post(`/user/${userId}/group`)
        .set('authorization', authorization)
        .send({
            groupName: `${label} group`,
            groupSharedItems: items.map((item) => ({
                ...item,
                isShared:
                    (item.type === 'account' && item.id === accountId) ||
                    (item.type === 'category' && item.id === categoryId) ||
                    (item.type === 'income' && item.id === incomeId),
            })),
        })
        .expect(HttpCode.OK);

    const personAgent = agent();
    await createIncomeTransaction(personAgent, userId, authorization, accountId, incomeId, 'USD', flow, TX_DATE);
    await createExpenseTransaction(personAgent, userId, authorization, accountId, categoryId, 'USD', flow, TX_DATE);

    return {
        label,
        userId,
        auth: authorization,
        email,
        accountId,
        categoryId,
        incomeId,
        privateCategoryId,
        userGroupId: group.body.data.userGroupId,
        seed,
        flow,
    };
};

/**
 * Connects two users both ways: the owner shares through their own group, the member
 * answers with theirs, so neither side is a one-way mirror.
 */
const connect = async (owner: IPerson, member: IPerson): Promise<number> => {
    await agent()
        .post(`/user/${owner.userId}/sharing/invite`)
        .set('authorization', owner.auth)
        .send({ email: member.email, userGroupId: owner.userGroupId })
        .expect(HttpCode.OK);

    const sent = await agent().get(`/user/${owner.userId}/sharing/connections/sent`).set('authorization', owner.auth);
    const pending = (sent.body.data as { connectionId: number; email: string }[]).find((row) => row.email === member.email);
    expect(pending).toBeDefined();
    const connectionId = (pending as { connectionId: number }).connectionId;

    await agent()
        .post(`/user/${member.userId}/sharing/connection/${connectionId}/accept`)
        .set('authorization', member.auth)
        .expect(HttpCode.NO_CONTENT);

    await agent()
        .patch(`/user/${member.userId}/sharing/connection/${connectionId}/member`)
        .set('authorization', member.auth)
        .send({ userGroupId: member.userGroupId })
        .expect(HttpCode.NO_CONTENT);

    return connectionId;
};

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-expect-error listen returns a Server the util accepts as never
    server = app.listen(port);

    A = await setupPerson('A', 100, 10);
    B = await setupPerson('B', 200, 20);
    C = await setupPerson('C', 300, 30);
    D = await setupPerson('D', 400, 40);
    E = await setupPerson('E', 500, 50);

    await connect(A, B);
    await connect(B, C);
});

afterAll(async () => {
    // Transactions point at the shared categories/accounts, so they must go before the
    // per-user cleanup in closeTestApp or the FK on categories trips.
    await db.engine()('transactions').whereIn('userId', userIds).delete();
    await db.engine()('groupshareditem').whereIn('userId', userIds).delete();
    await db.engine()('userconnections').whereIn('ownerUserId', userIds).orWhereIn('memberUserId', userIds).delete();
    await closeTestApp(server, userIds);
});

describe('Sharing chain - who sees whose items', () => {
    const cases = (): [string, () => IPerson, () => IPerson[]][] => [
        ['A sees A and B, never C, D or E', () => A, () => [A, B]],
        ['B bridges both connections and sees A, B and C', () => B, () => [A, B, C]],
        ['C sees B and C, never A', () => C, () => [B, C]],
        ['D is connected to nobody and sees only itself', () => D, () => [D]],
        ['E is connected to nobody and sees only itself', () => E, () => [E]],
    ];

    it.each(cases())('%s', async (_name, viewerOf, visibleOf) => {
        const viewer = viewerOf();
        const visible = visibleOf();
        const accounts = await listedIds(viewer, 'accounts', 'accountId');
        const categories = await listedIds(viewer, 'categories', 'categoryId');
        const incomes = await listedIds(viewer, 'incomes', 'incomeId');

        for (const person of [A, B, C, D, E]) {
            const expected = visible.includes(person);
            expect([person.label, accounts.includes(person.accountId)]).toEqual([person.label, expected]);
            expect([person.label, categories.includes(person.categoryId)]).toEqual([person.label, expected]);
            expect([person.label, incomes.includes(person.incomeId)]).toEqual([person.label, expected]);
        }
    });

    it.each(cases())('%s - a private category never leaves its owner', async (_name, viewerOf) => {
        const viewer = viewerOf();
        const categories = await listedIds(viewer, 'categories', 'categoryId');

        for (const person of [A, B, C, D, E]) {
            expect([person.label, categories.includes(person.privateCategoryId)]).toEqual([
                person.label,
                person.userId === viewer.userId,
            ]);
        }
    });

    it('A can open the item B shared but not the one B kept private', async () => {
        await agent().get(`/user/${A.userId}/category/${B.categoryId}`).set('authorization', A.auth).expect(HttpCode.OK);
        await agent().get(`/user/${A.userId}/account/${B.accountId}`).set('authorization', A.auth).expect(HttpCode.OK);
        await agent()
            .get(`/user/${A.userId}/category/${B.privateCategoryId}`)
            .set('authorization', A.auth)
            .expect(HttpCode.NOT_FOUND);
    });

    it('sharing does not travel through B: A cannot open anything of C, and C nothing of A', async () => {
        await agent().get(`/user/${A.userId}/category/${C.categoryId}`).set('authorization', A.auth).expect(HttpCode.NOT_FOUND);
        await agent().get(`/user/${A.userId}/account/${C.accountId}`).set('authorization', A.auth).expect(HttpCode.NOT_FOUND);
        await agent().get(`/user/${C.userId}/category/${A.categoryId}`).set('authorization', C.auth).expect(HttpCode.NOT_FOUND);
        await agent().get(`/user/${C.userId}/account/${A.accountId}`).set('authorization', C.auth).expect(HttpCode.NOT_FOUND);
    });

    it('a group whose owner never connected shares with nobody', async () => {
        for (const viewer of [A, B, C]) {
            const accounts = await listedIds(viewer, 'accounts', 'accountId');
            expect(accounts).not.toContain(D.accountId);
            expect(accounts).not.toContain(E.accountId);
        }
    });

    it('shared items are marked as not owned, own items are', async () => {
        const { body } = await agent().get(`/user/${A.userId}/accounts`).set('authorization', A.auth).expect(HttpCode.OK);
        const accounts = body.data as Record<string, unknown>[];

        expect(accounts.find((account) => account.accountId === A.accountId)?.isOwner).toBe(true);
        expect(accounts.find((account) => account.accountId === B.accountId)?.isOwner).toBe(false);
        for (const account of accounts) {
            expect(account.userId).toBeUndefined();
        }
    });
});

describe('Sharing chain - category stats follow the same boundaries', () => {
    it('the default scope merges own and shared, and stops at the direct connection', async () => {
        const ids = await categoryStatsIds(A);

        expect(ids).toContain(A.categoryId);
        expect(ids).toContain(A.privateCategoryId);
        expect(ids).toContain(B.categoryId);
        expect(ids).not.toContain(C.categoryId);
        expect(ids).not.toContain(D.categoryId);
    });

    it('scope=own drops everything that arrived through a connection', async () => {
        const ids = await categoryStatsIds(B, StatsScope.Own);

        expect(ids).toContain(B.categoryId);
        expect(ids).toContain(B.privateCategoryId);
        expect(ids).not.toContain(A.categoryId);
        expect(ids).not.toContain(C.categoryId);
    });

    it('scope=shared keeps the common pot of both connections for the bridge', async () => {
        const ids = await categoryStatsIds(B, StatsScope.Shared);

        expect(ids).toContain(A.categoryId);
        expect(ids).toContain(B.categoryId);
        expect(ids).toContain(C.categoryId);
        expect(ids).not.toContain(B.privateCategoryId);
    });

    it('scope=shared for C stops at B', async () => {
        const ids = await categoryStatsIds(C, StatsScope.Shared);

        expect(ids).toContain(B.categoryId);
        expect(ids).toContain(C.categoryId);
        expect(ids).not.toContain(A.categoryId);
    });

    it('scope=shared is empty for a user who never connected', async () => {
        expect(await categoryStatsIds(D, StatsScope.Shared)).toHaveLength(0);
        expect(await categoryStatsIds(E, StatsScope.Shared)).toHaveLength(0);
    });
});

describe('Sharing chain - balance', () => {
    it.each([
        ['A', () => A],
        ['B', () => B],
        ['C', () => C],
        ['D', () => D],
        ['E', () => E],
    ])('%s: the default balance is their own money only', async (_label, personOf) => {
        const person = personOf();
        expect(await balanceOf(person)).toBe(person.seed);
        expect(await balanceOf(person, StatsScope.Own)).toBe(person.seed);
    });

    it('scope=shared sums the accounts of the group, so A holds A + B', async () => {
        expect(await balanceOf(A, StatsScope.Shared)).toBe(A.seed + B.seed);
    });

    it('scope=shared for the bridge covers both sides: A + B + C', async () => {
        expect(await balanceOf(B, StatsScope.Shared)).toBe(A.seed + B.seed + C.seed);
    });

    it('scope=shared for C covers B + C and never reaches A', async () => {
        expect(await balanceOf(C, StatsScope.Shared)).toBe(B.seed + C.seed);
    });

    it('scope=shared is zero without a connection', async () => {
        expect(await balanceOf(D, StatsScope.Shared)).toBe(0);
        expect(await balanceOf(E, StatsScope.Shared)).toBe(0);
    });
});

describe('Sharing chain - summary totals name exactly who is visible', () => {
    it.each([
        ['A totals A + B', () => A, () => [A, B]],
        ['B totals A + B + C', () => B, () => [A, B, C]],
        ['C totals B + C', () => C, () => [B, C]],
        ['D totals only D', () => D, () => [D]],
        ['E totals only E', () => E, () => [E]],
    ])('%s', async (_name, personOf, contributorsOf) => {
        const expected = contributorsOf().reduce((sum, person) => sum + person.flow, 0);
        const summary = await summaryOf(personOf());

        expect(summary.income_total).toBe(expected);
        expect(summary.expense_total).toBe(expected);
    });

    it('scope=own strips the shared contribution back out', async () => {
        const summary = await summaryOf(B, StatsScope.Own);

        expect(summary.income_total).toBe(B.flow);
        expect(summary.expense_total).toBe(B.flow);
    });

    it('scope=shared for A never picks up what C spent', async () => {
        const summary = await summaryOf(A, StatsScope.Shared);

        expect(summary.expense_total).toBe(A.flow + B.flow);
        expect(summary.expense_total).not.toBe(A.flow + B.flow + C.flow);
    });

    it('scope=shared is empty without a connection', async () => {
        const summary = await summaryOf(D, StatsScope.Shared);

        expect(summary.income_total).toBe(0);
        expect(summary.expense_total).toBe(0);
    });
});

describe('Sharing chain - a connection is not an authorisation', () => {
    it('B cannot read A data by asking under A userId', async () => {
        await agent().get(`/user/${A.userId}/balance`).set('authorization', B.auth).expect(HttpCode.FORBIDDEN);
        await agent().get(`/user/${A.userId}/accounts`).set('authorization', B.auth).expect(HttpCode.FORBIDDEN);
    });

    it('B cannot rename the category A shared', async () => {
        const before = (await agent().get(`/user/${A.userId}/category/${A.categoryId}`).set('authorization', A.auth)).body.data
            .categoryName;

        const response = await agent()
            .patch(`/user/${B.userId}/category/${A.categoryId}`)
            .set('authorization', B.auth)
            .send({ categoryName: 'Renamed by B' });

        expect(response.status).toBeGreaterThanOrEqual(HttpCode.BAD_REQUEST);
        expect(
            (await agent().get(`/user/${A.userId}/category/${A.categoryId}`).set('authorization', A.auth)).body.data.categoryName,
        ).toBe(before);
    });
});
