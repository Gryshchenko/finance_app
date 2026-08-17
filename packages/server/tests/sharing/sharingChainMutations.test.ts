import { HttpCode, StatsScope } from '@tenpercent/shared';

import config from '../../src/config/dbConfig';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import { closeTestApp, generateSecureRandom } from '../TestsUtils.';

import {
    balanceOf,
    categoryStatsIds,
    cleanupSharingTables,
    connect,
    createAccount,
    createCategory,
    createGroup,
    IPerson,
    listedIds,
    patchGroupShares,
    setupPerson,
} from './SharingTestUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

/**
 * The same chain as `sharingChain.test.ts` - A <--> B <--> C - but here it moves.
 *
 * A static topology only proves that the joins are wired correctly once. Everything that
 * can actually leak happens on a change: a group is swapped under a live connection, an
 * item joins a group that is already shared, a connection is torn down. So this file runs
 * as one story and each block asserts the whole picture again afterwards - what the
 * mutating user sees, what their counterpart sees, and what the third user, who was not
 * part of the change at all, must keep seeing.
 *
 *      user   account   income = expense
 *      A        100           10
 *      B        200           20
 *      C        300           30
 *
 * Tests run in declaration order and share state on purpose; the state at the end of one
 * block is the starting point of the next.
 */

let server: never;
const userIds: number[] = [];
const db = DatabaseConnection.instance(config);

const agent = () => request.agent(server);

let A: IPerson;
let B: IPerson;
let C: IPerson;

/** A <-> B, A is the owner. */
let connectionAB: number;
/** B <-> C, B is the owner. */
let connectionBC: number;

/** Created by A after the connection to B already exists. */
let lateCategoryId: number;

/** B's second group, handed to C halfway through the story. */
let secondGroupId: number;
let secondAccountId: number;
let secondCategoryId: number;
const SECOND_ACCOUNT_AMOUNT = 2000;

const categoriesOf = (person: IPerson) => listedIds(agent, person, 'categories', 'categoryId');
const accountsOf = (person: IPerson) => listedIds(agent, person, 'accounts', 'accountId');
const incomesOf = (person: IPerson) => listedIds(agent, person, 'incomes', 'incomeId');

const connectionCount = async (person: IPerson): Promise<number> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/sharing/connections`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return (body.data as unknown[]).length;
};

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-expect-error listen returns a Server the util accepts as never
    server = app.listen(port);

    A = await setupPerson({ agent, db, userIds, label: 'A', seed: 100, flow: 10 });
    B = await setupPerson({ agent, db, userIds, label: 'B', seed: 200, flow: 20 });
    C = await setupPerson({ agent, db, userIds, label: 'C', seed: 300, flow: 30 });

    connectionAB = await connect(agent, A, B);
    connectionBC = await connect(agent, B, C);
});

afterAll(async () => {
    await cleanupSharingTables(db, userIds);
    await closeTestApp(server, userIds);
});

describe('Chain mutations - the starting point', () => {
    it('B hands the same group to both of its connections and A still cannot reach C', async () => {
        // B is the member of A's connection and the owner of C's, and in both it offers
        // the very same group. That is the case where a leak would be easiest: one group
        // row, two connections. A and C must still be invisible to each other.
        const aCategories = await categoriesOf(A);
        const cCategories = await categoriesOf(C);

        expect(aCategories).toContain(B.categoryId);
        expect(aCategories).not.toContain(C.categoryId);
        expect(cCategories).toContain(B.categoryId);
        expect(cCategories).not.toContain(A.categoryId);

        expect(await balanceOf(agent, A, StatsScope.Shared)).toBe(A.seed + B.seed);
        expect(await balanceOf(agent, C, StatsScope.Shared)).toBe(B.seed + C.seed);
    });
});

describe('Chain mutations - an item joins a group that is already shared', () => {
    it('a category that does not exist yet is invisible to everybody', async () => {
        lateCategoryId = (await createCategory(agent, A.userId, A.auth, 'A late category')).body.data.categoryId;

        expect(await categoriesOf(A)).toContain(lateCategoryId);
        expect(await categoriesOf(B)).not.toContain(lateCategoryId);
        expect(await categoriesOf(C)).not.toContain(lateCategoryId);
    });

    it('sharing it into the live group pushes it to B and no further', async () => {
        await patchGroupShares(agent, A, A.userGroupId, [
            { type: 'account', id: A.accountId },
            { type: 'category', id: A.categoryId },
            { type: 'category', id: lateCategoryId },
            { type: 'income', id: A.incomeId },
        ]);

        expect(await categoriesOf(B)).toContain(lateCategoryId);
        expect(await categoriesOf(C)).not.toContain(lateCategoryId);
        // The items shared before the patch are still shared - the sync must not drop them.
        expect(await categoriesOf(B)).toContain(A.categoryId);
        expect(await accountsOf(B)).toContain(A.accountId);
        expect(await incomesOf(B)).toContain(A.incomeId);
    });

    it('the new category reaches B stats as well, and C is still none the wiser', async () => {
        expect(await categoryStatsIds(agent, B)).toContain(lateCategoryId);
        expect(await categoryStatsIds(agent, C)).not.toContain(lateCategoryId);
    });

    it('unsharing it again takes it back off B', async () => {
        await patchGroupShares(agent, A, A.userGroupId, [
            { type: 'account', id: A.accountId },
            { type: 'category', id: A.categoryId },
            { type: 'income', id: A.incomeId },
        ]);

        expect(await categoriesOf(B)).not.toContain(lateCategoryId);
        expect(await categoriesOf(B)).toContain(A.categoryId);
        expect(await categoriesOf(A)).toContain(lateCategoryId);
    });
});

describe('Chain mutations - the owner swaps the group under a live connection', () => {
    it('B moves the C connection onto a second group', async () => {
        secondAccountId = (await createAccount(agent, B.userId, B.auth, 'B second account', SECOND_ACCOUNT_AMOUNT)).body.data
            .accountId;
        secondCategoryId = (await createCategory(agent, B.userId, B.auth, 'B second category')).body.data.categoryId;
        secondGroupId = await createGroup(agent, B, 'B second group', [
            { type: 'account', id: secondAccountId },
            { type: 'category', id: secondCategoryId },
        ]);

        // A group that exists but is not attached to any connection shares with nobody.
        expect(await categoriesOf(C)).not.toContain(secondCategoryId);

        await agent()
            .patch(`/user/${B.userId}/sharing/connection/${connectionBC}/owner`)
            .set('authorization', B.auth)
            .send({ userGroupId: secondGroupId })
            .expect(HttpCode.NO_CONTENT);
    });

    it('C swaps one set of B items for the other', async () => {
        const categories = await categoriesOf(C);
        const accounts = await accountsOf(C);
        const incomes = await incomesOf(C);

        expect(categories).toContain(secondCategoryId);
        expect(accounts).toContain(secondAccountId);
        expect(categories).not.toContain(B.categoryId);
        expect(accounts).not.toContain(B.accountId);
        expect(incomes).not.toContain(B.incomeId);
        // C keeps its own items either way.
        expect(categories).toContain(C.categoryId);
        expect(accounts).toContain(C.accountId);
    });

    it('A is on the other connection and notices nothing', async () => {
        const categories = await categoriesOf(A);
        const accounts = await accountsOf(A);

        expect(categories).toContain(B.categoryId);
        expect(accounts).toContain(B.accountId);
        expect(categories).not.toContain(secondCategoryId);
        expect(accounts).not.toContain(secondAccountId);
        expect(await balanceOf(agent, A, StatsScope.Shared)).toBe(A.seed + B.seed);
    });

    it('the shared balance of C follows the swap', async () => {
        expect(await balanceOf(agent, C, StatsScope.Shared)).toBe(SECOND_ACCOUNT_AMOUNT + C.seed);
        // The new account carries no transactions, so nothing of B shows up in C stats.
        expect(await categoryStatsIds(agent, C, StatsScope.Shared)).not.toContain(B.categoryId);
        expect(await balanceOf(agent, C)).toBe(C.seed + C.privateSeed);
    });

    it('B still bridges both connections, now with three sets of items', async () => {
        const categories = await categoriesOf(B);

        expect(categories).toContain(A.categoryId);
        expect(categories).toContain(B.categoryId);
        expect(categories).toContain(secondCategoryId);
        expect(categories).toContain(C.categoryId);
        expect(await balanceOf(agent, B, StatsScope.Shared)).toBe(A.seed + B.seed + SECOND_ACCOUNT_AMOUNT + C.seed);
    });
});

describe('Chain mutations - the member swaps their own group', () => {
    it('C answers the connection with a group that shares nothing', async () => {
        const emptyGroupId = await createGroup(agent, C, 'C empty group', []);

        await agent()
            .patch(`/user/${C.userId}/sharing/connection/${connectionBC}/member`)
            .set('authorization', C.auth)
            .send({ userGroupId: emptyGroupId })
            .expect(HttpCode.NO_CONTENT);

        // B loses C entirely, while what B gives C is untouched.
        const bCategories = await categoriesOf(B);
        expect(bCategories).not.toContain(C.categoryId);
        expect(await accountsOf(B)).not.toContain(C.accountId);
        expect(await categoriesOf(C)).toContain(secondCategoryId);

        expect(await balanceOf(agent, B, StatsScope.Shared)).toBe(A.seed + B.seed + SECOND_ACCOUNT_AMOUNT);
    });

    it('and A, two connections away from that change, keeps its view', async () => {
        const categories = await categoriesOf(A);

        expect(categories).toContain(A.categoryId);
        expect(categories).toContain(B.categoryId);
        expect(categories).not.toContain(C.categoryId);
        expect(await balanceOf(agent, A, StatsScope.Shared)).toBe(A.seed + B.seed);
    });

    it('C puts its real group back', async () => {
        await agent()
            .patch(`/user/${C.userId}/sharing/connection/${connectionBC}/member`)
            .set('authorization', C.auth)
            .send({ userGroupId: C.userGroupId })
            .expect(HttpCode.NO_CONTENT);

        expect(await categoriesOf(B)).toContain(C.categoryId);
    });
});

describe('Chain mutations - a connection is torn down', () => {
    it('B drops C: neither side keeps anything of the other', async () => {
        await agent()
            .delete(`/user/${B.userId}/sharing/connection/${connectionBC}`)
            .set('authorization', B.auth)
            .expect(HttpCode.NO_CONTENT);

        const bCategories = await categoriesOf(B);
        expect(bCategories).not.toContain(C.categoryId);
        expect(await accountsOf(B)).not.toContain(C.accountId);

        const cCategories = await categoriesOf(C);
        expect(cCategories).not.toContain(B.categoryId);
        expect(cCategories).not.toContain(secondCategoryId);
        expect(await accountsOf(C)).not.toContain(secondAccountId);
        expect(await incomesOf(C)).not.toContain(B.incomeId);
    });

    it('C falls back to its own items only', async () => {
        expect(await balanceOf(agent, C, StatsScope.Shared)).toBe(0);
        expect(await categoryStatsIds(agent, C, StatsScope.Shared)).toHaveLength(0);
        expect(await connectionCount(C)).toBe(0);
        expect(await categoriesOf(C)).toContain(C.categoryId);
        expect(await balanceOf(agent, C)).toBe(C.seed + C.privateSeed);
    });

    it('A was not part of that connection and still sees B', async () => {
        const categories = await categoriesOf(A);

        expect(categories).toContain(B.categoryId);
        expect(categories).not.toContain(C.categoryId);
        expect(await balanceOf(agent, A, StatsScope.Shared)).toBe(A.seed + B.seed);
        expect(await connectionCount(A)).toBe(1);
    });

    it('B keeps the connection it did not drop', async () => {
        const categories = await categoriesOf(B);

        expect(categories).toContain(A.categoryId);
        expect(await balanceOf(agent, B, StatsScope.Shared)).toBe(A.seed + B.seed);
        expect(await connectionCount(B)).toBe(1);
    });

    it('B leaves the connection A owns and the chain is empty', async () => {
        await agent()
            .delete(`/user/${B.userId}/sharing/connection/${connectionAB}/leave`)
            .set('authorization', B.auth)
            .expect(HttpCode.NO_CONTENT);

        for (const person of [A, B, C]) {
            const categories = await categoriesOf(person);
            const accounts = await accountsOf(person);

            expect([person.label, categories]).toEqual([person.label, expect.arrayContaining([person.categoryId])]);
            for (const other of [A, B, C].filter((candidate) => candidate.userId !== person.userId)) {
                expect([person.label, other.label, categories.includes(other.categoryId)]).toEqual([
                    person.label,
                    other.label,
                    false,
                ]);
                expect([person.label, other.label, accounts.includes(other.accountId)]).toEqual([
                    person.label,
                    other.label,
                    false,
                ]);
            }
            expect([person.label, await balanceOf(agent, person, StatsScope.Shared)]).toEqual([person.label, 0]);
            expect([person.label, await connectionCount(person)]).toEqual([person.label, 0]);
        }
    });

    it('the group rows survive the teardown, so a new connection shares them again', async () => {
        // groupshareditem is not cleaned up when a connection goes away - the group is
        // simply no longer reachable. Reconnecting must therefore restore the old view.
        const reconnected = await connect(agent, A, B);
        expect(reconnected).not.toBe(connectionAB);

        expect(await categoriesOf(A)).toContain(B.categoryId);
        expect(await categoriesOf(B)).toContain(A.categoryId);
        expect(await balanceOf(agent, A, StatsScope.Shared)).toBe(A.seed + B.seed);
        expect(await categoriesOf(C)).not.toContain(A.categoryId);
    });
});
