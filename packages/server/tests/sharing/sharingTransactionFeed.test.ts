import { HttpCode, StatsScope, TransactionType } from '@tenpercent/shared';

import config from '../../src/config/dbConfig';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import { closeTestApp, generateSecureRandom } from '../TestsUtils.';

import { cleanupSharingTables, connect, IPerson, setupPerson } from './SharingTestUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

/**
 * The transaction feed on the chain A <--> B <--> C.
 *
 * `TransactionDataAccess.getTransactions` filters the feed by the same accessible ids as
 * the lists and the stats, and there is no filter on `userId` - so a member's feed is a
 * merged feed by design. This file pins down where that merge stops:
 *
 *   - A must see the transactions B booked on the items B shared,
 *   - A must never see anything of C, not through the feed and not through a direct id,
 *   - a transaction on an item nobody shared stays with its owner, even when the owner is
 *     otherwise connected.
 *
 * Every person keeps a second, private account/category/income triple, so a transaction
 * exists that touches no shared item at all. Amounts are unique per person and per set:
 *
 *      user   shared account   flow   private account   private flow
 *      A            100         10         1100              11
 *      B            200         20         1200              22
 *      C            300         30         1300              33
 */

let server: never;
const userIds: number[] = [];
const db = DatabaseConnection.instance(config);

const agent = () => request.agent(server);

let A: IPerson;
let B: IPerson;
let C: IPerson;

interface IFeedItem {
    transactionId: number;
    amount: number | string;
    categoryName?: string;
    incomeName?: string;
    accountName?: string;
    transactionTypeId: TransactionType;
}

const feedOf = async (person: IPerson, query = ''): Promise<IFeedItem[]> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/transactions/?limit=100${query}`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return body.data.data as IFeedItem[];
};

const feedIds = async (person: IPerson, query = ''): Promise<number[]> =>
    (await feedOf(person, query)).map((item) => item.transactionId);

const openTransaction = (viewer: IPerson, transactionId: number) =>
    agent().get(`/user/${viewer.userId}/transaction/${transactionId}`).set('authorization', viewer.auth);

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-expect-error listen returns a Server the util accepts as never
    server = app.listen(port);

    A = await setupPerson({ agent, db, userIds, label: 'A', seed: 100, flow: 10, privateSeed: 1100, privateFlow: 11 });
    B = await setupPerson({ agent, db, userIds, label: 'B', seed: 200, flow: 20, privateSeed: 1200, privateFlow: 22 });
    C = await setupPerson({ agent, db, userIds, label: 'C', seed: 300, flow: 30, privateSeed: 1300, privateFlow: 33 });

    await connect(agent, A, B);
    await connect(agent, B, C);
});

afterAll(async () => {
    await cleanupSharingTables(db, userIds);
    await closeTestApp(server, userIds);
});

describe('Feed - the merge stops at the direct connection', () => {
    it('A sees everything of its own', async () => {
        const ids = await feedIds(A);

        expect(ids).toContain(A.incomeTransactionId);
        expect(ids).toContain(A.expenseTransactionId);
        expect(ids).toContain(A.privateIncomeTransactionId);
        expect(ids).toContain(A.privateExpenseTransactionId);
    });

    it('A sees what B booked on the shared items and nothing C booked', async () => {
        const ids = await feedIds(A);

        expect(ids).toContain(B.incomeTransactionId);
        expect(ids).toContain(B.expenseTransactionId);
        expect(ids).not.toContain(C.incomeTransactionId);
        expect(ids).not.toContain(C.expenseTransactionId);
        expect(ids).not.toContain(C.privateIncomeTransactionId);
        expect(ids).not.toContain(C.privateExpenseTransactionId);
    });

    it('C sees B but never A, so the feed does not travel along the chain', async () => {
        const ids = await feedIds(C);

        expect(ids).toContain(C.expenseTransactionId);
        expect(ids).toContain(B.expenseTransactionId);
        expect(ids).not.toContain(A.incomeTransactionId);
        expect(ids).not.toContain(A.expenseTransactionId);
    });

    it('B bridges both connections and its feed holds all three', async () => {
        const ids = await feedIds(B);

        expect(ids).toContain(A.expenseTransactionId);
        expect(ids).toContain(B.expenseTransactionId);
        expect(ids).toContain(C.expenseTransactionId);
    });

    it('a transaction on an unshared account never leaves its owner', async () => {
        // The private set is in no group at all: neither the account, nor the category,
        // nor the income of that transaction is reachable through the connection.
        const aFeed = await feedIds(A);
        const cFeed = await feedIds(C);

        expect(aFeed).not.toContain(B.privateIncomeTransactionId);
        expect(aFeed).not.toContain(B.privateExpenseTransactionId);
        expect(cFeed).not.toContain(B.privateIncomeTransactionId);
        expect(cFeed).not.toContain(B.privateExpenseTransactionId);
    });

    it('the amounts in the feed name exactly who contributed', async () => {
        // amount comes back as a numeric string from the DB driver.
        const amounts = (await feedOf(A)).map((item) => Number(item.amount)).sort((left, right) => left - right);

        // A: 10 + 10 shared, 11 + 11 private; B: 20 + 20 shared. Nothing of C, nothing
        // of B private - an unexpected amount here means an unexpected contributor.
        expect(amounts).toEqual([10, 10, 11, 11, 20, 20]);
    });
});

describe('Feed - a direct id is no shortcut', () => {
    it('A can open the transaction B booked on a shared item', async () => {
        const { body } = await openTransaction(A, B.expenseTransactionId).expect(HttpCode.OK);

        expect(body.data.transactionId).toBe(B.expenseTransactionId);
        expect(Number(body.data.amount)).toBe(B.flow);
        expect(body.data.isOwner).toBe(false);
        expect(body.data.userId).toBeUndefined();
    });

    it('and its own with isOwner true', async () => {
        const { body } = await openTransaction(A, A.expenseTransactionId).expect(HttpCode.OK);

        expect(body.data.isOwner).toBe(true);
    });

    it('A cannot open a transaction of C by guessing the id', async () => {
        await openTransaction(A, C.expenseTransactionId).expect(HttpCode.NOT_FOUND);
        await openTransaction(A, C.incomeTransactionId).expect(HttpCode.NOT_FOUND);
        await openTransaction(C, A.expenseTransactionId).expect(HttpCode.NOT_FOUND);
    });

    it('A cannot open the transaction B kept on its private account', async () => {
        await openTransaction(A, B.privateExpenseTransactionId).expect(HttpCode.NOT_FOUND);
        await openTransaction(A, B.privateIncomeTransactionId).expect(HttpCode.NOT_FOUND);
    });

    it('a member may read a shared transaction but not change or delete it', async () => {
        const patched = await agent()
            .patch(`/user/${A.userId}/transaction/${B.expenseTransactionId}`)
            .set('authorization', A.auth)
            .send({ amount: 999 });
        expect(patched.status).toBeGreaterThanOrEqual(HttpCode.BAD_REQUEST);

        const deleted = await agent()
            .delete(`/user/${A.userId}/transaction/${B.expenseTransactionId}`)
            .set('authorization', A.auth);
        expect(deleted.status).toBeGreaterThanOrEqual(HttpCode.BAD_REQUEST);

        const { body } = await openTransaction(B, B.expenseTransactionId).expect(HttpCode.OK);
        expect(Number(body.data.amount)).toBe(B.flow);
    });
});

describe('Feed - filtering by an item obeys the same boundary', () => {
    it('A can filter the feed down to the category B shared', async () => {
        const ids = await feedIds(A, `&categoryId=${B.categoryId}`);

        expect(ids).toEqual([B.expenseTransactionId]);
    });

    it('filtering by an item of C gives A an empty feed, not an error', async () => {
        expect(await feedIds(A, `&categoryId=${C.categoryId}`)).toEqual([]);
        expect(await feedIds(A, `&accountId=${C.accountId}`)).toEqual([]);
        expect(await feedIds(A, `&incomeId=${C.incomeId}`)).toEqual([]);
    });

    it('filtering by an item B kept private gives A an empty feed', async () => {
        expect(await feedIds(A, `&categoryId=${B.privateCategoryId}`)).toEqual([]);
        expect(await feedIds(A, `&accountId=${B.privateAccountId}`)).toEqual([]);
    });

    it('the shared account of B carries both of the B transactions for A', async () => {
        const ids = await feedIds(A, `&accountId=${B.accountId}`);

        expect(ids).toHaveLength(2);
        expect(ids).toEqual(expect.arrayContaining([B.incomeTransactionId, B.expenseTransactionId]));
    });
});

describe('Feed - what the list item does not say', () => {
    it('a feed row carries no owner marker at all', async () => {
        // Current behaviour, pinned down deliberately: `getTransactions` selects
        // `profiles.publicName`, but `TransactionController.getAll` does not map it into
        // the response and the row has no `isOwner` either - unlike `GET /transaction/:id`.
        // A row of B is therefore indistinguishable from a row of A in the merged feed.
        // Change this test the moment the response starts carrying the owner.
        const rows = await feedOf(A);
        const foreign = rows.find((row) => row.transactionId === B.expenseTransactionId) as unknown as Record<string, unknown>;

        expect(foreign).toBeDefined();
        expect(foreign.isOwner).toBeUndefined();
        expect(foreign.publicName).toBeUndefined();
        expect(foreign.userId).toBeUndefined();
    });
});

describe('Feed - scope narrows the merge', () => {
    it('the default is own + shared, the same feed as before the parameter existed', async () => {
        expect(await feedIds(A)).toEqual(await feedIds(A, `&scope=${StatsScope.All}`));
    });

    it('scope=own leaves A with the four transactions it booked itself', async () => {
        const ids = await feedIds(A, `&scope=${StatsScope.Own}`);

        expect(ids).toEqual(
            expect.arrayContaining([
                A.incomeTransactionId,
                A.expenseTransactionId,
                A.privateIncomeTransactionId,
                A.privateExpenseTransactionId,
            ]),
        );
        expect(ids).toHaveLength(4);
        expect(ids).not.toContain(B.expenseTransactionId);
    });

    it('scope=shared is the common pot: the group of A and B, and nothing private', async () => {
        const ids = await feedIds(A, `&scope=${StatsScope.Shared}`);

        expect(ids).toEqual(
            expect.arrayContaining([
                A.incomeTransactionId,
                A.expenseTransactionId,
                B.incomeTransactionId,
                B.expenseTransactionId,
            ]),
        );
        expect(ids).toHaveLength(4);
        expect(ids).not.toContain(A.privateExpenseTransactionId);
        expect(ids).not.toContain(C.expenseTransactionId);
    });

    it('scope does not widen the merge: the bridge sees three sets, C never sees A', async () => {
        expect(await feedIds(B, `&scope=${StatsScope.Shared}`)).toEqual(
            expect.arrayContaining([A.expenseTransactionId, B.expenseTransactionId, C.expenseTransactionId]),
        );
        expect(await feedIds(C, `&scope=${StatsScope.Shared}`)).not.toContain(A.expenseTransactionId);
    });

    it('scope=shared drops an own item that was never put in a group', async () => {
        expect(await feedIds(A, `&scope=${StatsScope.Shared}&categoryId=${A.privateCategoryId}`)).toEqual([]);
        expect(await feedIds(A, `&scope=${StatsScope.Own}&categoryId=${A.privateCategoryId}`)).toEqual([
            A.privateExpenseTransactionId,
        ]);
    });

    it('scope combines with a filter instead of overriding it', async () => {
        expect(await feedIds(A, `&scope=${StatsScope.Own}&categoryId=${B.categoryId}`)).toEqual([]);
        expect(await feedIds(A, `&scope=${StatsScope.Shared}&categoryId=${B.categoryId}`)).toEqual([B.expenseTransactionId]);
    });

    it('an unknown scope is rejected instead of falling back', async () => {
        await agent()
            .get(`/user/${A.userId}/transactions/?limit=100&scope=everything`)
            .set('authorization', A.auth)
            .expect(HttpCode.BAD_REQUEST);
    });
});

describe('Feed - a connection is not an authorisation', () => {
    it('B cannot read the feed of A by asking under the A userId', async () => {
        await agent().get(`/user/${A.userId}/transactions/?limit=10`).set('authorization', B.auth).expect(HttpCode.FORBIDDEN);
    });
});
