import { HttpCode, StatsPeriod, StatsScope } from '@tenpercent/shared';
import { Agent } from 'supertest';

import { IDatabaseConnection } from '../../src/interfaces/IDatabaseConnection';
import { createUser, generateRandomEmail, generateRandomName } from '../TestsUtils.';
import { createExpenseTransaction, createIncomeTransaction } from '../transactions/TransactionsTestUtils';

/**
 * Setup shared by the sharing test files: a person owns two sets of items - one shared
 * into a group, one kept out of every group - and moves the same amount in and out of
 * each account, so an account ends the month exactly where it started.
 *
 *      account (shared)  seed        income = expense  flow
 *      account (private) privateSeed income = expense  privateFlow
 *
 * The private set exists so a test can tell "invisible because the item is private" from
 * "invisible because the connection does not reach that far": a private *category* on a
 * *shared* account still surfaces through the account, a transaction on the private
 * account never surfaces at all.
 */

export type ItemType = 'account' | 'category' | 'income';

export interface IItem {
    id: number;
    type: ItemType;
    name: string;
    isShared: boolean;
}

export interface IShareRef {
    type: ItemType;
    id: number;
}

export interface IPerson {
    label: string;
    userId: number;
    auth: string;
    email: string;
    publicName: string;
    /** Shared into `userGroupId`. */
    accountId: number;
    categoryId: number;
    incomeId: number;
    /** Never shared into any group. */
    privateAccountId: number;
    privateCategoryId: number;
    privateIncomeId: number;
    userGroupId: number;
    /** Starting amount of the shared account. */
    seed: number;
    /** Starting amount of the private account. */
    privateSeed: number;
    /** Moved in and back out of the shared account on TX_DATE. */
    flow: number;
    /** Moved in and back out of the private account on TX_DATE. */
    privateFlow: number;
    /** Transactions on the shared account. */
    incomeTransactionId: number;
    expenseTransactionId: number;
    /** Transactions on the private account - visible to nobody else. */
    privateIncomeTransactionId: number;
    privateExpenseTransactionId: number;
}

/** One month holds every transaction, so a single month window sees all of them. */
export const TX_DATE = '2025-12-15T11:00:00.000Z';
export const FROM = '2025-12-01T00:00:00.000Z';
export const TO = '2025-12-31T00:00:00.000Z';

type AgentFactory = () => Agent;

export const createAccount = (agent: AgentFactory, uid: number, auth: string, accountName: string, amount: number) =>
    agent()
        .post(`/user/${uid}/account`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', accountName, amount, iconId: 'wallet' })
        .expect(HttpCode.OK);

export const createCategory = (agent: AgentFactory, uid: number, auth: string, categoryName: string) =>
    agent()
        .post(`/user/${uid}/category`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', categoryName, iconId: 'wallet' })
        .expect(HttpCode.OK);

export const createIncome = (agent: AgentFactory, uid: number, auth: string, incomeName: string) =>
    agent()
        .post(`/user/${uid}/income`)
        .set('authorization', auth)
        .send({ currencyCode: 'USD', incomeName, iconId: 'bnb' })
        .expect(HttpCode.OK);

export const shareableItems = async (agent: AgentFactory, person: IPerson): Promise<IItem[]> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/groups/shareable-items`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return body.data as IItem[];
};

/** Flags exactly `refs` as shared and everything else as not shared. */
export const withShares = (items: IItem[], refs: IShareRef[]): IItem[] =>
    items.map((item) => ({
        ...item,
        isShared: refs.some((ref) => ref.type === item.type && ref.id === item.id),
    }));

export const createGroup = async (
    agent: AgentFactory,
    person: IPerson,
    groupName: string,
    refs: IShareRef[],
): Promise<number> => {
    const items = await shareableItems(agent, person);
    const { body } = await agent()
        .post(`/user/${person.userId}/group`)
        .set('authorization', person.auth)
        .send({ groupName, groupSharedItems: withShares(items, refs) })
        .expect(HttpCode.OK);
    return body.data.userGroupId as number;
};

/** Re-syncs which of `person`'s items sit in `userGroupId`; items left out of `refs` are unshared. */
export const patchGroupShares = async (
    agent: AgentFactory,
    person: IPerson,
    userGroupId: number,
    refs: IShareRef[],
): Promise<void> => {
    const items = await shareableItems(agent, person);
    await agent()
        .patch(`/user/${person.userId}/group/${userGroupId}`)
        .set('authorization', person.auth)
        .send({ groupSharedItems: withShares(items, refs) })
        .expect(HttpCode.NO_CONTENT);
};

export const setupPerson = async ({
    agent,
    db,
    userIds,
    label,
    seed,
    flow,
    privateSeed = 0,
    privateFlow = 0,
}: {
    agent: AgentFactory;
    db: IDatabaseConnection;
    /** Collected for cleanup. */
    userIds: number[];
    label: string;
    seed: number;
    flow: number;
    privateSeed?: number;
    privateFlow?: number;
}): Promise<IPerson> => {
    const email = generateRandomEmail();
    const publicName = `${label}_${generateRandomName()}`;
    const { userId, authorization } = await createUser({ agent: agent(), email, publicName, databaseConnection: db });
    userIds.push(userId);

    const accountId = (await createAccount(agent, userId, authorization, `${label} shared account`, seed)).body.data.accountId;
    const categoryId = (await createCategory(agent, userId, authorization, `${label} shared category`)).body.data.categoryId;
    const incomeId = (await createIncome(agent, userId, authorization, `${label} shared income`)).body.data.incomeId;
    const privateAccountId = (await createAccount(agent, userId, authorization, `${label} private account`, privateSeed)).body
        .data.accountId;
    const privateCategoryId = (await createCategory(agent, userId, authorization, `${label} private category`)).body.data
        .categoryId;
    const privateIncomeId = (await createIncome(agent, userId, authorization, `${label} private income`)).body.data.incomeId;

    const person: IPerson = {
        label,
        userId,
        auth: authorization,
        email,
        publicName,
        accountId,
        categoryId,
        incomeId,
        privateAccountId,
        privateCategoryId,
        privateIncomeId,
        userGroupId: 0,
        seed,
        privateSeed,
        flow,
        privateFlow,
        incomeTransactionId: 0,
        expenseTransactionId: 0,
        privateIncomeTransactionId: 0,
        privateExpenseTransactionId: 0,
    };

    person.userGroupId = await createGroup(agent, person, `${label} group`, [
        { type: 'account', id: accountId },
        { type: 'category', id: categoryId },
        { type: 'income', id: incomeId },
    ]);

    const personAgent = agent();
    person.incomeTransactionId = await createIncomeTransaction(
        personAgent,
        userId,
        authorization,
        accountId,
        incomeId,
        'USD',
        flow,
        TX_DATE,
    );
    person.expenseTransactionId = await createExpenseTransaction(
        personAgent,
        userId,
        authorization,
        accountId,
        categoryId,
        'USD',
        flow,
        TX_DATE,
    );

    if (privateFlow > 0) {
        person.privateIncomeTransactionId = await createIncomeTransaction(
            personAgent,
            userId,
            authorization,
            privateAccountId,
            privateIncomeId,
            'USD',
            privateFlow,
            TX_DATE,
        );
        person.privateExpenseTransactionId = await createExpenseTransaction(
            personAgent,
            userId,
            authorization,
            privateAccountId,
            privateCategoryId,
            'USD',
            privateFlow,
            TX_DATE,
        );
    }

    return person;
};

/**
 * Connects two users both ways: the owner shares through their own group, the member
 * answers with theirs, so neither side is a one-way mirror.
 */
export const connect = async (agent: AgentFactory, owner: IPerson, member: IPerson): Promise<number> => {
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

const idsOf = (rows: Record<string, number>[], key: string): number[] => rows.map((row) => row[key]);

export const listedIds = async (
    agent: AgentFactory,
    person: IPerson,
    path: 'accounts' | 'categories' | 'incomes',
    key: string,
): Promise<number[]> => {
    const { body } = await agent().get(`/user/${person.userId}/${path}`).set('authorization', person.auth).expect(HttpCode.OK);
    return idsOf(body.data, key);
};

const scopeQuery = (scope?: StatsScope) => (scope ? `&scope=${scope}` : '');

export const categoryStatsIds = async (agent: AgentFactory, person: IPerson, scope?: StatsScope): Promise<number[]> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/categories/stats?from=${FROM}&to=${TO}&period=${StatsPeriod.Month}${scopeQuery(scope)}`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return idsOf(body.data.items, 'categoryId');
};

export const incomeStatsIds = async (agent: AgentFactory, person: IPerson, scope?: StatsScope): Promise<number[]> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/incomes/stats?from=${FROM}&to=${TO}&period=${StatsPeriod.Month}${scopeQuery(scope)}`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return idsOf(body.data.items, 'incomeId');
};

export const balanceOf = async (agent: AgentFactory, person: IPerson, scope?: StatsScope): Promise<number> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/balance${scope ? `?scope=${scope}` : ''}`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return body.data.balance;
};

export const summaryOf = async (
    agent: AgentFactory,
    person: IPerson,
    scope?: StatsScope,
): Promise<{ income_total: number; expense_total: number }> => {
    const { body } = await agent()
        .get(`/user/${person.userId}/stats/summary?from=${FROM}&to=${TO}&period=${StatsPeriod.Month}${scopeQuery(scope)}`)
        .set('authorization', person.auth)
        .expect(HttpCode.OK);
    return body.data;
};

/**
 * Transactions must go before the per-user cleanup in `closeTestApp`, otherwise the FK
 * from transactions to the shared categories/accounts trips.
 */
export const cleanupSharingTables = async (db: IDatabaseConnection, userIds: number[]): Promise<void> => {
    await db.engine()('transactions').whereIn('userId', userIds).delete();
    await db.engine()('groupshareditem').whereIn('userId', userIds).delete();
    await db.engine()('userconnections').whereIn('ownerUserId', userIds).orWhereIn('memberUserId', userIds).delete();
};
