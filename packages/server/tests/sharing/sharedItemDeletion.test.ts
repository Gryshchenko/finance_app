import { ErrorCode, HttpCode, StatsScope } from '@tenpercent/shared';

import config from '../../src/config/dbConfig';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import { closeTestApp, generateSecureRandom } from '../TestsUtils.';
import { createExpenseTransaction } from '../transactions/TransactionsTestUtils';

import {
    balanceOf,
    categoryStatsIds,
    cleanupSharingTables,
    connect,
    createAccount,
    createCategory,
    createGroup,
    incomeStatsIds,
    IPerson,
    IShareRef,
    listedIds,
    patchGroupShares,
    setupPerson,
    shareableItems,
    summaryOf,
    TX_DATE,
} from './SharingTestUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

/**
 * Deleting an item that is shared, from both sides of the connection.
 *
 * A shared item cannot be deleted at all: the three orchestration services ask
 * `getSharedEntity` first and refuse with `*_DELETE_GROUP_ERROR` while a `groupshareditem`
 * row exists. The owner has to take the item out of the group first, so the sequence the
 * member experiences is always the same - the *unshare* is what takes the item away, and
 * the delete that follows is a purely local act the member cannot even observe.
 *
 * That guard is also what keeps `groupshareditem` from outliving the item it points at.
 * The read path does not defend against such a row on its own - the last block writes one
 * the way the pre-guard code left them behind and shows what it still does.
 *
 *      user   shared account   income = expense   private account   income = expense
 *      O           500               50                5000               55
 *      M           700               70                7000               77
 *
 * On top of that O books "cross" expenses on the *private* account through *shared*
 * categories. Those are the only transactions that reach M through a single item, so they
 * are the only ones that can show whether losing that item takes them away. Everything
 * else sits on the shared account too, and an account keeps its history when a category
 * disappears.
 *
 * The blocks run in order and each one changes something, so the state left behind by one
 * block is the input of the next.
 */

let server: never;
const userIds: number[] = [];
const db = DatabaseConnection.instance(config);

const agent = () => request.agent(server);

/** Owner of the shared items - the one doing the deleting. */
let O: IPerson;
/** Member on the other side of the connection - the one who must stop seeing them. */
let M: IPerson;

/** Shared by O, but only ever used on the private account of O. */
let crossCategoryId: number;
let crossTransactionId: number;
const CROSS_FLOW = 13;

/** The same shape, kept for the stale-row block at the end. */
let staleCategoryId: number;
let staleTransactionId: number;
const STALE_FLOW = 17;

/** In a group that is attached to no connection at all. */
let lonelyAccountId: number;
const LONELY_ACCOUNT_AMOUNT = 42;

const categoriesOf = (person: IPerson) => listedIds(agent, person, 'categories', 'categoryId');
const accountsOf = (person: IPerson) => listedIds(agent, person, 'accounts', 'accountId');
const incomesOf = (person: IPerson) => listedIds(agent, person, 'incomes', 'incomeId');

const feedIds = async (person: IPerson, query = ''): Promise<number[]> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/transactions/?limit=100${query}`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return (body.data.data as { transactionId: number }[]).map((item) => item.transactionId);
};

const groupItemIds = async (person: IPerson, type: 'account' | 'category' | 'income'): Promise<number[]> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/group/${person.userGroupId}`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return (body.data.groupSharedItems as { id: number; type: string }[])
        .filter((item) => item.type === type)
        .map((item) => item.id);
};

const shareableItemIds = async (person: IPerson, type: 'account' | 'category' | 'income'): Promise<number[]> =>
    (await shareableItems(agent, person)).filter((item) => item.type === type).map((item) => item.id);

const tryDelete = (person: IPerson, path: string, id: number, keepData: boolean) =>
    agent().delete(`/user/${person.userId}/${path}/${id}`).set('authorization', person.auth).send({ keepData });

const deleteCategory = (person: IPerson, categoryId: number, keepData: boolean) =>
    tryDelete(person, 'category', categoryId, keepData).expect(HttpCode.NO_CONTENT);

const deleteIncome = (person: IPerson, incomeId: number, keepData: boolean) =>
    tryDelete(person, 'income', incomeId, keepData).expect(HttpCode.NO_CONTENT);

const deleteAccount = (person: IPerson, accountId: number, keepData: boolean) =>
    tryDelete(person, 'account', accountId, keepData).expect(HttpCode.NO_CONTENT);

/** Everything O has in the group at the start; blocks below drop entries from it. */
const sharesOfO = (): IShareRef[] => [
    { type: 'account', id: O.accountId },
    { type: 'category', id: O.categoryId },
    { type: 'category', id: crossCategoryId },
    { type: 'income', id: O.incomeId },
];

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-expect-error listen returns a Server the util accepts as never
    server = app.listen(port);

    O = await setupPerson({ agent, db, userIds, label: 'O', seed: 500, flow: 50, privateSeed: 5000, privateFlow: 55 });
    M = await setupPerson({ agent, db, userIds, label: 'M', seed: 700, flow: 70, privateSeed: 7000, privateFlow: 77 });

    crossCategoryId = (await createCategory(agent, O.userId, O.auth, 'O cross category')).body.data.categoryId;
    await patchGroupShares(agent, O, O.userGroupId, sharesOfO());
    crossTransactionId = await createExpenseTransaction(
        agent(),
        O.userId,
        O.auth,
        O.privateAccountId,
        crossCategoryId,
        'USD',
        CROSS_FLOW,
        TX_DATE,
    );

    await connect(agent, O, M);
});

afterAll(async () => {
    await cleanupSharingTables(db, userIds);
    await closeTestApp(server, userIds);
});

/** Everything M can see at the start: its own two sets, plus what O shares. */
const M_TOTAL_EXPENSE = 70 + 77 + 50 + CROSS_FLOW;
/** The same, minus the money that only reached M through the cross category. */
const M_TOTAL_EXPENSE_WITHOUT_CROSS = M_TOTAL_EXPENSE - CROSS_FLOW;

describe('Deleted shared items - the member sees the shared items to begin with', () => {
    it('the category, the account and the income of O are all visible to M', async () => {
        expect(await categoriesOf(M)).toContain(O.categoryId);
        expect(await categoriesOf(M)).toContain(crossCategoryId);
        expect(await accountsOf(M)).toContain(O.accountId);
        expect(await incomesOf(M)).toContain(O.incomeId);
    });

    it('and so are the stats, the totals and the balance behind them', async () => {
        expect(await categoryStatsIds(agent, M)).toContain(O.categoryId);
        expect(await incomeStatsIds(agent, M)).toContain(O.incomeId);
        expect(await balanceOf(agent, M, StatsScope.Shared)).toBe(O.seed + M.seed);
        expect((await summaryOf(agent, M)).expense_total).toBe(M_TOTAL_EXPENSE);
        expect((await summaryOf(agent, M, StatsScope.Shared)).expense_total).toBe(M.flow + O.flow + CROSS_FLOW);
    });

    it('the cross transaction reaches M through the category alone', async () => {
        // Its account is private to O, so the category is the only way in - and the only
        // thing that can take it away again.
        expect(await feedIds(M)).toContain(crossTransactionId);
        expect(await accountsOf(M)).not.toContain(O.privateAccountId);
    });
});

describe('Deleted shared items - a shared category is refused until it leaves the group', () => {
    it('the delete is rejected while the category sits in a group', async () => {
        const response = await tryDelete(O, 'category', crossCategoryId, true);

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body.errors[0].errorCode).toBe(ErrorCode.CATEGORY_DELETE_GROUP_ERROR);
    });

    it('so nothing moved for either side', async () => {
        expect(await categoriesOf(O)).toContain(crossCategoryId);
        expect(await categoriesOf(M)).toContain(crossCategoryId);
        expect(await feedIds(M)).toContain(crossTransactionId);
    });

    it('the unshare is what takes it away from the member, before any delete happens', async () => {
        await patchGroupShares(
            agent,
            O,
            O.userGroupId,
            sharesOfO().filter((ref) => ref.id !== crossCategoryId),
        );

        expect(await categoriesOf(M)).not.toContain(crossCategoryId);
        expect(await categoryStatsIds(agent, M)).not.toContain(crossCategoryId);
        expect(await feedIds(M)).not.toContain(crossTransactionId);
        expect((await summaryOf(agent, M)).expense_total).toBe(M_TOTAL_EXPENSE_WITHOUT_CROSS);
        await agent()
            .get(`/user/${M.userId}/category/${crossCategoryId}`)
            .set('authorization', M.auth)
            .expect(HttpCode.NOT_FOUND);

        // The owner still has the category, untouched.
        expect(await categoriesOf(O)).toContain(crossCategoryId);
    });

    it('and now the delete goes through', async () => {
        await deleteCategory(O, crossCategoryId, true);

        expect(await categoriesOf(O)).not.toContain(crossCategoryId);
        expect(await categoryStatsIds(agent, O)).not.toContain(crossCategoryId);
        await agent()
            .get(`/user/${O.userId}/category/${crossCategoryId}`)
            .set('authorization', O.auth)
            .expect(HttpCode.NOT_FOUND);
        // keepData: true, so the transaction itself is still there for its owner.
        expect(await feedIds(O)).toContain(crossTransactionId);
    });

    it('the member notices nothing, because it lost the category one step earlier', async () => {
        expect(await categoriesOf(M)).not.toContain(crossCategoryId);
        expect(await feedIds(M)).not.toContain(crossTransactionId);
        expect((await summaryOf(agent, M)).expense_total).toBe(M_TOTAL_EXPENSE_WITHOUT_CROSS);
    });

    it('the group stops offering a deleted item as shareable', async () => {
        expect(await groupItemIds(O, 'category')).not.toContain(crossCategoryId);
        expect(await shareableItemIds(O, 'category')).not.toContain(crossCategoryId);
    });

    it('nothing else of the owner moved', async () => {
        expect(await categoriesOf(M)).toContain(O.categoryId);
        expect(await accountsOf(M)).toContain(O.accountId);
        expect(await incomesOf(M)).toContain(O.incomeId);
        expect(await balanceOf(agent, M, StatsScope.Shared)).toBe(O.seed + M.seed);
        expect(await feedIds(M)).toContain(O.expenseTransactionId);
    });
});

describe('Deleted shared items - a category whose account stays in the group', () => {
    it('unshare, then delete with keepData', async () => {
        await patchGroupShares(
            agent,
            O,
            O.userGroupId,
            sharesOfO().filter((ref) => ref.id !== crossCategoryId && ref.id !== O.categoryId),
        );
        await deleteCategory(O, O.categoryId, true);
    });

    it('the member stops seeing it in the list and in the stats', async () => {
        expect(await categoriesOf(M)).not.toContain(O.categoryId);
        expect(await categoryStatsIds(agent, M)).not.toContain(O.categoryId);
        expect(await categoryStatsIds(agent, M, StatsScope.Shared)).not.toContain(O.categoryId);
        await agent().get(`/user/${M.userId}/category/${O.categoryId}`).set('authorization', M.auth).expect(HttpCode.NOT_FOUND);
    });

    it('but the money it moved stays, because the account it moved from is still shared', async () => {
        // Losing a category does not undo the spending: the expense still left the shared
        // account, so it stays in the feed and in the totals of both sides. Only the
        // per-category breakdown loses the row.
        expect(await feedIds(M)).toContain(O.expenseTransactionId);
        expect((await summaryOf(agent, M)).expense_total).toBe(M_TOTAL_EXPENSE_WITHOUT_CROSS);
        expect(await balanceOf(agent, M, StatsScope.Shared)).toBe(O.seed + M.seed);
    });

    it('the own items of the member are untouched', async () => {
        expect(await categoriesOf(M)).toContain(M.categoryId);
        expect(await categoryStatsIds(agent, M)).toContain(M.categoryId);
    });
});

describe('Deleted shared items - a shared income is refused the same way', () => {
    it('the delete is rejected while the income sits in a group', async () => {
        const response = await tryDelete(O, 'income', O.incomeId, false);

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body.errors[0].errorCode).toBe(ErrorCode.INCOME_DELETE_GROUP_ERROR);
        expect(await incomesOf(M)).toContain(O.incomeId);
    });

    it('unshare, then delete with keepData: false', async () => {
        await patchGroupShares(agent, O, O.userGroupId, [{ type: 'account', id: O.accountId }]);
        await deleteIncome(O, O.incomeId, false);
    });

    it('the member stops seeing the income in the list and in the stats', async () => {
        expect(await incomesOf(M)).not.toContain(O.incomeId);
        expect(await incomeStatsIds(agent, M)).not.toContain(O.incomeId);
        expect(await incomeStatsIds(agent, M, StatsScope.Shared)).not.toContain(O.incomeId);
        await agent().get(`/user/${M.userId}/income/${O.incomeId}`).set('authorization', M.auth).expect(HttpCode.NOT_FOUND);
    });

    it('keepData: false takes the transaction away from both feeds', async () => {
        expect(await feedIds(O)).not.toContain(O.incomeTransactionId);
        expect(await feedIds(M)).not.toContain(O.incomeTransactionId);
    });

    it('the income totals of the member lose what the owner earned', async () => {
        expect((await summaryOf(agent, M)).income_total).toBe(M.flow + M.privateFlow);
        expect((await summaryOf(agent, M, StatsScope.Shared)).income_total).toBe(M.flow);
    });
});

describe('Deleted shared items - a shared account is refused too', () => {
    it('the delete is rejected while the account sits in a group', async () => {
        const response = await tryDelete(O, 'account', O.accountId, false);

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body.errors[0].errorCode).toBe(ErrorCode.ACCOUNT_DELETE_GROUP_ERROR);
    });

    it('so the member keeps seeing it', async () => {
        expect(await accountsOf(M)).toContain(O.accountId);
        expect(await balanceOf(agent, M, StatsScope.Shared)).toBe(O.seed + M.seed);
        expect(await feedIds(M)).toContain(O.expenseTransactionId);
    });

    it('the guard fires on the group row alone, with no connection anywhere near it', async () => {
        // A group nobody is connected to shares with nobody - `sharingChainMutations`
        // pins that down - yet an account inside one still cannot be deleted.
        lonelyAccountId = (await createAccount(agent, O.userId, O.auth, 'O lonely account', LONELY_ACCOUNT_AMOUNT)).body.data
            .accountId;
        await createGroup(agent, O, 'O lonely group', [{ type: 'account', id: lonelyAccountId }]);

        const response = await tryDelete(O, 'account', lonelyAccountId, false);

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body.errors[0].errorCode).toBe(ErrorCode.ACCOUNT_DELETE_GROUP_ERROR);
    });

    it('yet that account is in nobody shared scope, not even in the one of its owner', async () => {
        // The guard and `scope=shared` do not agree: `resolveSharedAccessibleItems` only
        // walks groups that hang off a connection, so the lonely account is in no shared
        // pot anywhere - the member cannot see it, and neither can O through that scope.
        expect(await balanceOf(agent, O, StatsScope.Shared)).toBe(O.seed + M.seed);
        expect(await balanceOf(agent, M, StatsScope.Shared)).toBe(O.seed + M.seed);
        expect(await accountsOf(M)).not.toContain(lonelyAccountId);
    });

    it('an account that is in no group deletes as before', async () => {
        await deleteAccount(O, O.privateAccountId, false);
        expect(await accountsOf(O)).not.toContain(O.privateAccountId);
    });

    it('unsharing the account first makes the delete go through', async () => {
        await patchGroupShares(agent, O, O.userGroupId, []);
        await deleteAccount(O, O.accountId, false);

        expect(await accountsOf(M)).not.toContain(O.accountId);
        await agent().get(`/user/${M.userId}/account/${O.accountId}`).set('authorization', M.auth).expect(HttpCode.NOT_FOUND);
    });

    it('the shared balance of the member drops the deleted account', async () => {
        expect(await balanceOf(agent, M, StatsScope.Shared)).toBe(M.seed);
        expect(await balanceOf(agent, M)).toBe(M.seed + M.privateSeed);
    });

    it('and with keepData: false the transactions of that account go too', async () => {
        expect(await feedIds(M)).not.toContain(O.expenseTransactionId);
    });

    it('the member is left with its own items and the connection is still there', async () => {
        expect(await categoriesOf(M)).toContain(M.categoryId);
        expect(await accountsOf(M)).toContain(M.accountId);
        expect(await incomesOf(M)).toContain(M.incomeId);

        const { body } = await agent()
            .get(`/user/${M.userId}/sharing/connections`)
            .set('authorization', M.auth)
            .expect(HttpCode.OK);
        expect((body.data as unknown[]).length).toBe(1);
    });
});

describe('Deleted shared items - a stale group row from before the guard', () => {
    /**
     * The three delete guards, plus the `isDeleted = false` filter on the insert in
     * `shareItem`, mean the API can no longer produce a row that points at a deleted item -
     * which is why the row below has to be written by hand. What is left is not a reachable
     * leak but an assumption: `resolveAllAccessibleItems` trusts every `groupshareditem`
     * row without joining the item tables, so its correctness now depends on three other
     * services keeping their guard. Rows that predate the guard, and the window between the
     * guard SELECT and the delete (nothing locks the item row), still land here.
     */
    it('the member sees the item while it is shared, as usual', async () => {
        staleCategoryId = (await createCategory(agent, O.userId, O.auth, 'O stale category')).body.data.categoryId;
        await patchGroupShares(agent, O, O.userGroupId, [{ type: 'category', id: staleCategoryId }]);
        // On the lonely account: O still owns it, but it is in a group with no connection,
        // so it cannot carry the transaction to M on its own - the category has to.
        staleTransactionId = await createExpenseTransaction(
            agent(),
            O.userId,
            O.auth,
            lonelyAccountId,
            staleCategoryId,
            'USD',
            STALE_FLOW,
            TX_DATE,
        );

        expect(await categoriesOf(M)).toContain(staleCategoryId);
        expect(await feedIds(M)).toContain(staleTransactionId);
    });

    it('the item is soft-deleted the way the pre-guard delete left it, row and all', async () => {
        // Straight to the table: the API would refuse this now, which is the whole point.
        await db.engine()('categories').where({ categoryId: staleCategoryId }).update({ isDeleted: true });

        const rows = await db.engine()('groupshareditem').where({ userId: O.userId, categoryId: staleCategoryId });
        expect(rows).toHaveLength(1);
    });

    it('the lists and the stats already ignore it', async () => {
        expect(await categoriesOf(M)).not.toContain(staleCategoryId);
        expect(await categoryStatsIds(agent, M)).not.toContain(staleCategoryId);
        expect(await categoryStatsIds(agent, M, StatsScope.Shared)).not.toContain(staleCategoryId);
        await agent()
            .get(`/user/${M.userId}/category/${staleCategoryId}`)
            .set('authorization', M.auth)
            .expect(HttpCode.NOT_FOUND);
    });

    it('scope=shared ignores it as well', async () => {
        // `resolveSharedAccessibleItems` joins the item tables and filters `isDeleted`.
        expect((await summaryOf(agent, M, StatsScope.Shared)).expense_total).toBe(M.flow);
    });

    it.failing('the transaction behind it leaves the feed of the member', async () => {
        // `resolveAllAccessibleItems` (the default scope) reads the shared ids straight out
        // of `groupshareditem`, so the id of a soft-deleted item stays accessible and its
        // transactions stay in the feed of everyone it was shared with. Turn this back into
        // `it(...)` if the `shared` CTE in `resolveAccessibleItems.ts` ever filters
        // `isDeleted` the way `resolveSharedAccessibleItems` two functions below does.
        expect(await feedIds(M)).not.toContain(staleTransactionId);
    });

    it.failing('and its money leaves the default totals of the member', async () => {
        expect((await summaryOf(agent, M)).expense_total).toBe(M.flow + M.privateFlow);
    });

    it('the owner keeps the items it never shared', async () => {
        expect(await categoriesOf(O)).toContain(O.privateCategoryId);
        expect(await incomesOf(O)).toContain(O.privateIncomeId);
        // Both accounts that held money are deleted, so all O has left is the account it
        // could not delete, minus the stale expense booked on it.
        expect(await accountsOf(O)).toContain(lonelyAccountId);
        expect(await accountsOf(O)).not.toContain(O.accountId);
        expect(await balanceOf(agent, O)).toBe(LONELY_ACCOUNT_AMOUNT - STALE_FLOW);
    });
});
