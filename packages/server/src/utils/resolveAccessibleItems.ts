import { ErrorCode, StatsScope } from '@tenpercent/shared';
import { Knex } from 'knex';

import Logger from 'helper/logger/Logger';
import { ConnectionStatus } from 'types/ConnectionStatus';

import { ValidationError } from './errors/ValidationError';

export interface IAccessibleItems {
    incomeIds: number[] | undefined;
    accountIds: number[] | undefined;
    categoryIds: number[] | undefined;
}

/**
 * Ids of the items a request may touch.
 *
 * Every set is derived from `userId` alone - the caller never supplies item ids - so
 * `scope` can only narrow the result, never widen it. That is what makes it safe to
 * drive straight from a query parameter.
 *
 * - `All` (default) - own items plus everything shared into the user's groups. This is
 *   the historical behaviour of every call site, so omitting `scope` changes nothing.
 * - `Own` - only the user's own items.
 * - `Shared` - only items sitting in a group the user belongs to. Includes the user's
 *   own items that they shared into a group: the "shared" tab is the common pot, not
 *   "other people's things". `Own` and `Shared` therefore overlap.
 */
export const resolveAccessibleItems = async (
    db: Knex,
    userId: number,
    scope: StatsScope = StatsScope.All,
): Promise<IAccessibleItems> => {
    switch (scope) {
        case StatsScope.Own:
            return resolveOwnAccessibleItems(db, userId);
        case StatsScope.Shared:
            return resolveSharedAccessibleItems(db, userId);
        default:
            return resolveAllAccessibleItems(db, userId);
    }
};

/** Groups the user takes part in through an accepted connection, either side of it. */
const GROUP_IDS_CTE = `
    with group_ids as (
        select unnest(array[u."userGroupId", u."memberUserGroupId"]) as id
        from userconnections u
        where u.status = ?
          and (u."memberUserId" = ? or u."ownerUserId" = ?)
    ),
         shared as (
             select g."incomeId", g."accountId", g."categoryId"
             from groupshareditem g
             where g."userGroupId" in (select id from group_ids)
         )
`;

const resolveAllAccessibleItems = async (db: Knex, userId: number): Promise<IAccessibleItems> => {
    try {
        const result = await db.raw(
            `
                ${GROUP_IDS_CTE}
                select
                    (select array_agg(DISTINCT id) from (
                                                            select "incomeId" as id from shared where "incomeId" is not null
                                                            union
                                                            select "incomeId" from incomes where "userId" = ? and "isDeleted" = false
                                                        ) t) as "incomeIds",
                    (select array_agg(DISTINCT id) from (
                                                            select "accountId" as id from shared where "accountId" is not null
                                                            union
                                                            select "accountId" from accounts where "userId" = ? and "isDeleted" = false
                                                        ) t) as "accountIds",
                    (select array_agg(DISTINCT id) from (
                                                            select "categoryId" as id from shared where "categoryId" is not null
                                                            union
                                                            select "categoryId" from categories where "userId" = ? and "isDeleted" = false
                                                        ) t) as "categoryIds"
                `,
            [ConnectionStatus.Connected, userId, userId, userId, userId, userId],
        );
        return toAccessibleItems(result);
    } catch (e) {
        Logger.Of('resolveAccessibleItems').error((e as { message: string }).message);
        return { incomeIds: undefined, accountIds: undefined, categoryIds: undefined };
    }
};

export const resolveOwnAccessibleItems = async (db: Knex, userId: number): Promise<IAccessibleItems> => {
    try {
        const result = await db.raw(
            `
                select
                    (select array_agg(DISTINCT id) from ( select "incomeId" as id from incomes where "userId" = ? and "isDeleted" = false) t) as "incomeIds",
                    (select array_agg(DISTINCT id) from ( select "accountId" as id from accounts where "userId" = ? and "isDeleted" = false) t) as "accountIds",
                    (select array_agg(DISTINCT id) from ( select "categoryId" as id from categories where "userId" = ? and "isDeleted" = false) t) as "categoryIds"
                `,
            [userId, userId, userId],
        );
        return toAccessibleItems(result);
    } catch (e) {
        Logger.Of('resolveOwnAccessibleItems').error((e as { message: string }).message);
        return { incomeIds: undefined, accountIds: undefined, categoryIds: undefined };
    }
};

/**
 * Items shared into the user's groups. Deleted items are excluded here too: a
 * groupshareditem row outlives the soft-delete of the item it points at.
 */
export const resolveSharedAccessibleItems = async (db: Knex, userId: number): Promise<IAccessibleItems> => {
    try {
        const result = await db.raw(
            `
                ${GROUP_IDS_CTE}
                select
                    (select array_agg(DISTINCT id) from (
                                                            select s."incomeId" as id from shared s
                                                            join incomes i on i."incomeId" = s."incomeId"
                                                            where s."incomeId" is not null and i."isDeleted" = false
                                                        ) t) as "incomeIds",
                    (select array_agg(DISTINCT id) from (
                                                            select s."accountId" as id from shared s
                                                            join accounts a on a."accountId" = s."accountId"
                                                            where s."accountId" is not null and a."isDeleted" = false
                                                        ) t) as "accountIds",
                    (select array_agg(DISTINCT id) from (
                                                            select s."categoryId" as id from shared s
                                                            join categories c on c."categoryId" = s."categoryId"
                                                            where s."categoryId" is not null and c."isDeleted" = false
                                                        ) t) as "categoryIds"
                `,
            [ConnectionStatus.Connected, userId, userId],
        );
        return toAccessibleItems(result);
    } catch (e) {
        Logger.Of('resolveSharedAccessibleItems').error((e as { message: string }).message);
        return { incomeIds: undefined, accountIds: undefined, categoryIds: undefined };
    }
};

const toAccessibleItems = (result: { rows: IAccessibleItems[] }): IAccessibleItems => ({
    incomeIds: result.rows[0].incomeIds ?? [],
    accountIds: result.rows[0].accountIds ?? [],
    categoryIds: result.rows[0].categoryIds ?? [],
});

export const assertAccessibleIds = (ids: number[] | undefined, entity: 'accounts' | 'incomes' | 'categories'): number[] => {
    if (ids === undefined) {
        throw new ValidationError({
            message: `Failed to resolve accessible ${entity}- cannot continue`,
            errorCode: ErrorCode.GROUP_SHARED_ERROR,
        });
    }
    return ids;
};
