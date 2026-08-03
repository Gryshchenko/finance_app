import { HttpCode } from '@tenpercent/shared';

import { closeTestApp, createUser, generateSecureRandom } from '../TestsUtils.';
import config from '../../src/config/dbConfig';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

let server: never;
const userIds: number[] = [];
const db = DatabaseConnection.instance(config);

let userId: number;
let auth: string;
let accountId: number;
let incomeId: number;
let categoryId: number;

const agent = () => request.agent(server);

type Item = { id: number; type: string; name: string; isShared: boolean };

const shareableItems = () => agent().get(`/user/${userId}/groups/shareable-items`).set('authorization', auth);
const getGroup = (id: number) => agent().get(`/user/${userId}/group/${id}`).set('authorization', auth);
const findItem = (items: Item[], type: string, id: number): Item | undefined =>
    items.find((it) => it.type === type && it.id === id);

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-expect-error listen returns a Server the util accepts as never
    server = app.listen(port);

    const user = await createUser({ agent: agent(), databaseConnection: db });
    userId = user.userId;
    auth = user.authorization;
    userIds.push(userId);

    const account = await agent()
        .post(`/user/${userId}/account`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', accountName: 'Checking', amount: 100, iconId: 'wallet' })
        .expect(HttpCode.OK);
    accountId = account.body.data.accountId;

    const income = await agent()
        .post(`/user/${userId}/income`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', incomeName: 'Salary', iconId: 'bnb' })
        .expect(HttpCode.OK);
    incomeId = income.body.data.incomeId;

    const category = await agent()
        .post(`/user/${userId}/category`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', categoryName: 'Groceries', iconId: 'wallet' })
        .expect(HttpCode.OK);
    categoryId = category.body.data.categoryId;
});

afterAll(async () => {
    await db.engine()('groupshareditem').whereIn('userId', userIds).delete();
    await closeTestApp(server, userIds);
});

describe('Group shared items', () => {
    let userGroupId: number;

    it('shareable-items: lists all owner accounts/incomes/categories as not shared', async () => {
        const res = await shareableItems().expect(HttpCode.OK);
        const items = res.body.data;
        expect(findItem(items, 'account', accountId)).toEqual(
            expect.objectContaining({ id: accountId, type: 'account', name: 'Checking', isShared: false }),
        );
        expect(findItem(items, 'income', incomeId)).toEqual(expect.objectContaining({ isShared: false, name: 'Salary' }));
        expect(findItem(items, 'category', categoryId)).toEqual(expect.objectContaining({ isShared: false, name: 'Groceries' }));
    });

    it('create: group with the account shared persists that choice', async () => {
        const items = (await shareableItems()).body.data.map((it: Item) => ({
            ...it,
            isShared: it.type === 'account' && it.id === accountId,
        }));

        const created = await agent()
            .post(`/user/${userId}/group`)
            .set('authorization', auth)
            .send({ groupName: 'Shared', groupSharedItems: items })
            .expect(HttpCode.OK);
        userGroupId = created.body.data.userGroupId;

        const group = await getGroup(userGroupId).expect(HttpCode.OK);
        expect(findItem(group.body.data.groupSharedItems, 'account', accountId)?.isShared).toBe(true);
        expect(findItem(group.body.data.groupSharedItems, 'income', incomeId)?.isShared).toBe(false);
        expect(findItem(group.body.data.groupSharedItems, 'category', categoryId)?.isShared).toBe(false);
    });

    it('patch: unshares the account and shares the income', async () => {
        const items = (await getGroup(userGroupId)).body.data.groupSharedItems.map((it: Item) => ({
            ...it,
            isShared: it.type === 'income' && it.id === incomeId,
        }));

        await agent()
            .patch(`/user/${userId}/group/${userGroupId}`)
            .set('authorization', auth)
            .send({ groupSharedItems: items })
            .expect(HttpCode.NO_CONTENT);

        const group = await getGroup(userGroupId).expect(HttpCode.OK);
        expect(findItem(group.body.data.groupSharedItems, 'account', accountId)?.isShared).toBe(false);
        expect(findItem(group.body.data.groupSharedItems, 'income', incomeId)?.isShared).toBe(true);
    });

    it('patch: cannot inject shared items into a group owned by another user', async () => {
        // A second user with their own group and their own shareable item.
        const attacker = await createUser({ agent: agent(), databaseConnection: db });
        userIds.push(attacker.userId);
        const attackerAccount = await agent()
            .post(`/user/${attacker.userId}/account`)
            .set('authorization', attacker.authorization)
            .send({ currencyCode: 'USD', accountName: 'Evil', amount: 1, iconId: 'wallet' })
            .expect(HttpCode.OK);

        // Attacker targets the victim's group id via their own /user/:userId path.
        const res = await agent()
            .patch(`/user/${attacker.userId}/group/${userGroupId}`)
            .set('authorization', attacker.authorization)
            .send({
                groupSharedItems: [{ id: attackerAccount.body.data.accountId, type: 'account', name: 'Evil', isShared: true }],
            });
        expect(res.status).toBeGreaterThanOrEqual(400);

        // Nothing was written into the victim's group scope.
        const rows = await db.engine()('groupshareditem').where({ userGroupId }).andWhere({ userId: attacker.userId });
        expect(rows).toEqual([]);

        // Victim's own view of the group is unaffected.
        const group = await getGroup(userGroupId).expect(HttpCode.OK);
        expect(findItem(group.body.data.groupSharedItems, 'account', attackerAccount.body.data.accountId)).toBeUndefined();
    });

    // Canary for the future "view shared finances" (member-facing) read path.
    // groupshareditem has only per-column FKs (userId->users, userGroupId->usergroups), so a row can
    // physically exist that ties a FOREIGN user's item to this owner's group. Any read of a group's
    // shared items MUST stay scoped by the group owner (as getShareItems does via `WHERE a."userId" = owner`).
    // If someone later reads by userGroupId alone, or drops that owner scope, this test surfaces the leak.
    it('leak guard: a foreign-owned shared row never surfaces in the group view', async () => {
        const foreign = await createUser({ agent: agent(), databaseConnection: db });
        userIds.push(foreign.userId);
        const foreignAccount = await agent()
            .post(`/user/${foreign.userId}/account`)
            .set('authorization', foreign.authorization)
            .send({ currencyCode: 'USD', accountName: 'ForeignAcct', amount: 1, iconId: 'wallet' })
            .expect(HttpCode.OK);
        const foreignAccountId = foreignAccount.body.data.accountId;

        // Simulate pollution: foreign user's account marked shared into THIS owner's group.
        await db.engine()('groupshareditem').insert({ userGroupId, userId: foreign.userId, accountId: foreignAccountId });

        // Sanity: the polluted row is genuinely cross-owner for this group.
        const crossOwner = await db
            .engine()('groupshareditem as gsi')
            .join('usergroups as ug', 'ug.userGroupId', 'gsi.userGroupId')
            .where('gsi.userGroupId', userGroupId)
            .andWhereRaw('gsi."userId" <> ug."userId"')
            .select('gsi.sharedItemId');
        expect(crossOwner.length).toBeGreaterThan(0);

        // The owner's authoritative read is owner-scoped and must never expose the foreign item.
        const group = await getGroup(userGroupId).expect(HttpCode.OK);
        const items = group.body.data.groupSharedItems as Item[];
        expect(items.find((it) => it.type === 'account' && it.id === foreignAccountId)).toBeUndefined();
    });

    it('delete: a group that has shared items is removed without FK error', async () => {
        const items = (await shareableItems()).body.data.map((it: Item) => ({
            ...it,
            isShared: it.type === 'account' && it.id === accountId,
        }));
        const created = await agent()
            .post(`/user/${userId}/group`)
            .set('authorization', auth)
            .send({ groupName: 'Disposable', groupSharedItems: items })
            .expect(HttpCode.OK);
        const disposableId = created.body.data.userGroupId;

        // has a shared item but no connected members → delete must succeed (groupshareditem cascade-removed)
        await agent().delete(`/user/${userId}/group/${disposableId}`).set('authorization', auth).expect(HttpCode.NO_CONTENT);

        const after = await agent().get(`/user/${userId}/groups`).set('authorization', auth).expect(HttpCode.OK);
        expect(after.body.data.find((g: { userGroupId: number }) => g.userGroupId === disposableId)).toBeUndefined();
    });
});
