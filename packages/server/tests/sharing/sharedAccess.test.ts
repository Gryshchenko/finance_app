import { HttpCode, TransactionType } from '@tenpercent/shared';

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

// Unrelated user - never connected to anyone. Nothing shared may ever reach them.
let outsiderId: number;
let outsiderAuth: string;

// Owner's items: the first three get shared into the group, the last stays private.
let sharedAccountId: number;
let sharedCategoryId: number;
let sharedIncomeId: number;
let privateCategoryId: number;

// Member's own account - money always moves on your own account.
let memberAccountId: number;

let userGroupId: number;
let connectionId: number;

const agent = () => request.agent(server);

type Item = { id: number; type: string; name: string; isShared: boolean };

const createAccount = (uid: number, auth: string, accountName: string, amount = 100) =>
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

const listAccounts = (uid: number, auth: string) => agent().get(`/user/${uid}/accounts`).set('authorization', auth);
const listCategories = (uid: number, auth: string) => agent().get(`/user/${uid}/categories`).set('authorization', auth);
const listIncomes = (uid: number, auth: string) => agent().get(`/user/${uid}/incomes`).set('authorization', auth);
const getBalance = (uid: number, auth: string) => agent().get(`/user/${uid}/balance`).set('authorization', auth);

const shareableItems = (uid: number, auth: string) =>
    agent().get(`/user/${uid}/groups/shareable-items`).set('authorization', auth);
const getGroup = (uid: number, auth: string, gid: number) => agent().get(`/user/${uid}/group/${gid}`).set('authorization', auth);

const idsOf = (rows: { accountId?: number; categoryId?: number; incomeId?: number }[], key: string): number[] =>
    rows.map((r) => (r as Record<string, number>)[key]);

/** Re-sends the group's shared items with `isShared` recomputed by the given predicate. */
const setSharedItems = async (predicate: (item: Item) => boolean) => {
    const current = (await getGroup(ownerId, ownerAuth, userGroupId)).body.data.groupSharedItems as Item[];
    const items = current.map((it) => ({ ...it, isShared: predicate(it) }));
    await agent()
        .patch(`/user/${ownerId}/group/${userGroupId}`)
        .set('authorization', ownerAuth)
        .send({ groupSharedItems: items })
        .expect(HttpCode.NO_CONTENT);
};

/** Shares account+category+income (but never the private category) into the group. */
const shareDefaultItems = () =>
    setSharedItems(
        (it) =>
            (it.type === 'account' && it.id === sharedAccountId) ||
            (it.type === 'category' && it.id === sharedCategoryId) ||
            (it.type === 'income' && it.id === sharedIncomeId),
    );

const connectMember = async (): Promise<number> => {
    await agent()
        .post(`/user/${ownerId}/sharing/invite`)
        .set('authorization', ownerAuth)
        .send({ email: memberEmail, userGroupId })
        .expect(HttpCode.OK);
    const sent = await agent().get(`/user/${ownerId}/sharing/connections/sent`).set('authorization', ownerAuth);
    const id = sent.body.data[0].connectionId;
    await agent()
        .post(`/user/${memberId}/sharing/connection/${id}/accept`)
        .set('authorization', memberAuth)
        .expect(HttpCode.NO_CONTENT);
    return id;
};

const disconnectMember = async (id: number) =>
    agent().delete(`/user/${memberId}/sharing/connection/${id}/leave`).set('authorization', memberAuth);

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

    sharedAccountId = (await createAccount(ownerId, ownerAuth, 'Owner shared account', 500)).body.data.accountId;
    sharedCategoryId = (await createCategory(ownerId, ownerAuth, 'Owner shared category')).body.data.categoryId;
    sharedIncomeId = (await createIncome(ownerId, ownerAuth, 'Owner shared income')).body.data.incomeId;
    privateCategoryId = (await createCategory(ownerId, ownerAuth, 'Owner private category')).body.data.categoryId;

    memberAccountId = (await createAccount(memberId, memberAuth, 'Member own account', 1000)).body.data.accountId;

    const items = (await shareableItems(ownerId, ownerAuth)).body.data as Item[];
    const created = await agent()
        .post(`/user/${ownerId}/group`)
        .set('authorization', ownerAuth)
        .send({
            groupName: 'Household',
            groupSharedItems: items.map((it) => ({
                ...it,
                isShared:
                    (it.type === 'account' && it.id === sharedAccountId) ||
                    (it.type === 'category' && it.id === sharedCategoryId) ||
                    (it.type === 'income' && it.id === sharedIncomeId),
            })),
        })
        .expect(HttpCode.OK);
    userGroupId = created.body.data.userGroupId;
});

afterAll(async () => {
    // Transactions reference the shared categories/accounts, so they must go first or the
    // per-user cleanup in closeTestApp trips the FK on categories.
    await db.engine()('transactions').whereIn('userId', userIds).delete();
    await db.engine()('groupshareditem').whereIn('userId', userIds).delete();
    await db.engine()('userconnections').whereIn('ownerUserId', userIds).orWhereIn('memberUserId', userIds).delete();
    await closeTestApp(server, userIds);
});

describe('Shared access - visibility scope', () => {
    beforeAll(async () => {
        connectionId = await connectMember();
    });

    afterAll(async () => {
        await disconnectMember(connectionId);
    });

    it('member sees the owner shared account, category and income', async () => {
        expect(idsOf((await listAccounts(memberId, memberAuth)).body.data, 'accountId')).toContain(sharedAccountId);
        expect(idsOf((await listCategories(memberId, memberAuth)).body.data, 'categoryId')).toContain(sharedCategoryId);
        expect(idsOf((await listIncomes(memberId, memberAuth)).body.data, 'incomeId')).toContain(sharedIncomeId);
    });

    it('member never sees an item that was not shared', async () => {
        expect(idsOf((await listCategories(memberId, memberAuth)).body.data, 'categoryId')).not.toContain(privateCategoryId);
        await agent().get(`/user/${memberId}/category/${privateCategoryId}`).set('authorization', memberAuth).expect(404);
    });

    it('an unrelated user sees nothing of the owner, shared or not', async () => {
        const accounts = idsOf((await listAccounts(outsiderId, outsiderAuth)).body.data, 'accountId');
        const categories = idsOf((await listCategories(outsiderId, outsiderAuth)).body.data, 'categoryId');
        const incomes = idsOf((await listIncomes(outsiderId, outsiderAuth)).body.data, 'incomeId');

        expect(accounts).not.toContain(sharedAccountId);
        expect(categories).not.toContain(sharedCategoryId);
        expect(categories).not.toContain(privateCategoryId);
        expect(incomes).not.toContain(sharedIncomeId);
    });

    it('responses never leak a foreign userId and mark ownership correctly', async () => {
        const accounts = (await listAccounts(memberId, memberAuth)).body.data as Record<string, unknown>[];
        const shared = accounts.find((a) => a.accountId === sharedAccountId)!;
        const own = accounts.find((a) => a.accountId === memberAccountId)!;

        expect(shared.isOwner).toBe(false);
        expect(own.isOwner).toBe(true);
        for (const account of accounts) {
            expect(account.userId).toBeUndefined();
        }
    });

    it('member can open a shared item directly', async () => {
        await agent().get(`/user/${memberId}/account/${sharedAccountId}`).set('authorization', memberAuth).expect(HttpCode.OK);
        await agent().get(`/user/${memberId}/category/${sharedCategoryId}`).set('authorization', memberAuth).expect(HttpCode.OK);
    });
});

describe('Shared access - view only: edit and delete are owner-only', () => {
    beforeAll(async () => {
        connectionId = await connectMember();
    });

    afterAll(async () => {
        await disconnectMember(connectionId);
    });

    // Entities wrap "0 rows updated" differently (400 vs 404), so assert the contract that
    // actually matters: the write is rejected AND the owner's data is untouched.
    const asOwner = (path: string) => agent().get(`/user/${ownerId}/${path}`).set('authorization', ownerAuth);

    it('member cannot edit a shared category', async () => {
        const before = (await asOwner(`category/${sharedCategoryId}`)).body.data.categoryName;

        const res = await agent()
            .patch(`/user/${memberId}/category/${sharedCategoryId}`)
            .set('authorization', memberAuth)
            .send({ categoryName: 'Renamed by member' });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect((await asOwner(`category/${sharedCategoryId}`)).body.data.categoryName).toBe(before);
    });

    it('member cannot edit a shared account', async () => {
        const before = (await asOwner(`account/${sharedAccountId}`)).body.data.accountName;

        const res = await agent()
            .patch(`/user/${memberId}/account/${sharedAccountId}`)
            .set('authorization', memberAuth)
            .send({ accountName: 'Renamed by member' });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect((await asOwner(`account/${sharedAccountId}`)).body.data.accountName).toBe(before);
    });

    it('member cannot edit a shared income', async () => {
        const before = (await asOwner(`income/${sharedIncomeId}`)).body.data.incomeName;

        const res = await agent()
            .patch(`/user/${memberId}/income/${sharedIncomeId}`)
            .set('authorization', memberAuth)
            .send({ incomeName: 'Renamed by member' });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect((await asOwner(`income/${sharedIncomeId}`)).body.data.incomeName).toBe(before);
    });

    it('owner can still edit their own item', async () => {
        await agent()
            .patch(`/user/${ownerId}/category/${sharedCategoryId}`)
            .set('authorization', ownerAuth)
            .send({ categoryName: 'Renamed by owner' })
            .expect(HttpCode.NO_CONTENT);

        expect((await asOwner(`category/${sharedCategoryId}`)).body.data.categoryName).toBe('Renamed by owner');
    });

    it('member cannot delete a shared account, category or income', async () => {
        for (const path of [`account/${sharedAccountId}`, `category/${sharedCategoryId}`, `income/${sharedIncomeId}`] as const) {
            const res = await agent().delete(`/user/${memberId}/${path}`).set('authorization', memberAuth);
            expect(res.status).toBeGreaterThanOrEqual(400);
        }

        // Still alive for the owner.
        await asOwner(`account/${sharedAccountId}`).expect(HttpCode.OK);
        await asOwner(`category/${sharedCategoryId}`).expect(HttpCode.OK);
        await asOwner(`income/${sharedIncomeId}`).expect(HttpCode.OK);
    });
});

describe('Shared access - transactions', () => {
    beforeAll(async () => {
        connectionId = await connectMember();
    });

    afterAll(async () => {
        await disconnectMember(connectionId);
    });

    const expensePayload = (accountId: number, categoryId: number, amount = 10) => ({
        accountId,
        categoryId,
        transactionTypeId: TransactionType.Expense,
        amount,
        currencyCode: 'USD',
        targetAmount: amount,
        targetCurrencyCode: 'USD',
        description: 'shared spend',
    });

    it('member can spend from their own account into the owner shared category', async () => {
        await agent()
            .post(`/user/${memberId}/transaction/`)
            .set('authorization', memberAuth)
            .send(expensePayload(memberAccountId, sharedCategoryId))
            .expect(HttpCode.CREATED);
    });

    it('member owns the transaction they created into a shared category', async () => {
        const created = await agent()
            .post(`/user/${memberId}/transaction/`)
            .set('authorization', memberAuth)
            .send(expensePayload(memberAccountId, sharedCategoryId, 7))
            .expect(HttpCode.CREATED);
        const transactionId = created.body.data.transactionId ?? created.body.data;

        // It is their own transaction, so managing it must stay possible even though the
        // category behind it belongs to the owner.
        await agent().get(`/user/${memberId}/transaction/${transactionId}`).set('authorization', memberAuth).expect(HttpCode.OK);
        await agent()
            .patch(`/user/${memberId}/transaction/${transactionId}`)
            .set('authorization', memberAuth)
            .send({ amount: 9, targetAmount: 9 })
            .expect(HttpCode.NO_CONTENT);
        await agent()
            .delete(`/user/${memberId}/transaction/${transactionId}`)
            .set('authorization', memberAuth)
            .expect(HttpCode.NO_CONTENT);
    });

    it('member cannot use a category that was never shared with them', async () => {
        const res = await agent()
            .post(`/user/${memberId}/transaction/`)
            .set('authorization', memberAuth)
            .send(expensePayload(memberAccountId, privateCategoryId));
        expect(res.status).toBe(HttpCode.FORBIDDEN);
    });

    it('an unrelated user cannot use the shared category at all', async () => {
        const outsiderAccountId = (await createAccount(outsiderId, outsiderAuth, 'Outsider account')).body.data.accountId;
        const res = await agent()
            .post(`/user/${outsiderId}/transaction/`)
            .set('authorization', outsiderAuth)
            .send(expensePayload(outsiderAccountId, sharedCategoryId));
        expect(res.status).toBe(HttpCode.FORBIDDEN);
    });

    it('a transaction on shared entities is viewable by the member but not editable or deletable', async () => {
        const created = await agent()
            .post(`/user/${ownerId}/transaction/`)
            .set('authorization', ownerAuth)
            .send(expensePayload(sharedAccountId, sharedCategoryId))
            .expect(HttpCode.CREATED);
        const transactionId = created.body.data.transactionId ?? created.body.data;

        const amountBefore = (await agent().get(`/user/${ownerId}/account/${sharedAccountId}`).set('authorization', ownerAuth))
            .body.data.amount;

        // View is allowed - both the account and the category behind it are shared - but the
        // response must mark it foreign so the client can block edit/delete up front.
        const seenByMember = await agent()
            .get(`/user/${memberId}/transaction/${transactionId}`)
            .set('authorization', memberAuth)
            .expect(HttpCode.OK);
        expect(seenByMember.body.data.isOwner).toBe(false);
        expect(seenByMember.body.data.userId).toBeUndefined();

        const seenByOwner = await agent()
            .get(`/user/${ownerId}/transaction/${transactionId}`)
            .set('authorization', ownerAuth)
            .expect(HttpCode.OK);
        expect(seenByOwner.body.data.isOwner).toBe(true);

        const patched = await agent()
            .patch(`/user/${memberId}/transaction/${transactionId}`)
            .set('authorization', memberAuth)
            .send({ amount: 999, targetAmount: 999 });
        expect(patched.status).toBeGreaterThanOrEqual(400);

        const deleted = await agent().delete(`/user/${memberId}/transaction/${transactionId}`).set('authorization', memberAuth);
        expect(deleted.status).toBeGreaterThanOrEqual(400);

        // The rejected write must roll back cleanly: the transaction survives and the
        // owner's balance is untouched (patch/delete move money before the ownership check).
        await agent().get(`/user/${ownerId}/transaction/${transactionId}`).set('authorization', ownerAuth).expect(HttpCode.OK);
        const amountAfter = (await agent().get(`/user/${ownerId}/account/${sharedAccountId}`).set('authorization', ownerAuth))
            .body.data.amount;
        expect(amountAfter).toBe(amountBefore);
    });
});

describe('Shared access - balance is never inflated by shared accounts', () => {
    it('member balance counts only their own accounts', async () => {
        const before = (await getBalance(memberId, memberAuth).expect(HttpCode.OK)).body.data.balance;

        const id = await connectMember();
        const during = (await getBalance(memberId, memberAuth).expect(HttpCode.OK)).body.data.balance;
        const accounts = idsOf((await listAccounts(memberId, memberAuth)).body.data, 'accountId');

        await disconnectMember(id);

        // The shared account is visible in the list but must not reach the balance.
        expect(accounts).toContain(sharedAccountId);
        expect(during).toBe(before);
    });
});

describe('Shared access - revocation', () => {
    it('leaving the connection removes access to every shared item', async () => {
        const id = await connectMember();
        expect(idsOf((await listAccounts(memberId, memberAuth)).body.data, 'accountId')).toContain(sharedAccountId);

        await disconnectMember(id);

        expect(idsOf((await listAccounts(memberId, memberAuth)).body.data, 'accountId')).not.toContain(sharedAccountId);
        expect(idsOf((await listCategories(memberId, memberAuth)).body.data, 'categoryId')).not.toContain(sharedCategoryId);
        expect(idsOf((await listIncomes(memberId, memberAuth)).body.data, 'incomeId')).not.toContain(sharedIncomeId);
        await agent().get(`/user/${memberId}/account/${sharedAccountId}`).set('authorization', memberAuth).expect(404);
    });

    it('unsharing a single item revokes only that item', async () => {
        const id = await connectMember();
        await setSharedItems((it) => it.type === 'category' && it.id === sharedCategoryId);

        expect(idsOf((await listCategories(memberId, memberAuth)).body.data, 'categoryId')).toContain(sharedCategoryId);
        expect(idsOf((await listAccounts(memberId, memberAuth)).body.data, 'accountId')).not.toContain(sharedAccountId);

        await shareDefaultItems();
        await disconnectMember(id);
    });

    it('a pending invite grants no access before it is accepted', async () => {
        await agent()
            .post(`/user/${ownerId}/sharing/invite`)
            .set('authorization', ownerAuth)
            .send({ email: memberEmail, userGroupId })
            .expect(HttpCode.OK);

        expect(idsOf((await listAccounts(memberId, memberAuth)).body.data, 'accountId')).not.toContain(sharedAccountId);

        const sent = await agent().get(`/user/${ownerId}/sharing/connections/sent`).set('authorization', ownerAuth);
        const pendingId = sent.body.data[0].connectionId;
        await agent()
            .delete(`/user/${ownerId}/sharing/connection/${pendingId}`)
            .set('authorization', ownerAuth)
            .expect(HttpCode.NO_CONTENT);
    });

    it('a declined invite grants no access', async () => {
        await agent()
            .post(`/user/${ownerId}/sharing/invite`)
            .set('authorization', ownerAuth)
            .send({ email: memberEmail, userGroupId })
            .expect(HttpCode.OK);
        const sent = await agent().get(`/user/${ownerId}/sharing/connections/sent`).set('authorization', ownerAuth);
        const declinedId = sent.body.data[0].connectionId;

        await agent()
            .post(`/user/${memberId}/sharing/connection/${declinedId}/decline`)
            .set('authorization', memberAuth)
            .expect(HttpCode.NO_CONTENT);

        expect(idsOf((await listAccounts(memberId, memberAuth)).body.data, 'accountId')).not.toContain(sharedAccountId);
    });
});
