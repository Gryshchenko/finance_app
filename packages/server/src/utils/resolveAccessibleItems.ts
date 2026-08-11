import { ErrorCode } from '@tenpercent/shared';
import { Knex } from 'knex';

import Logger from 'helper/logger/Logger';
import { ConnectionStatus } from 'types/ConnectionStatus';

import { ValidationError } from './errors/ValidationError';

export const resolveAccessibleItems = async (
    db: Knex,
    userId: number,
): Promise<{
    incomeIds: number[] | undefined;
    accountIds: number[] | undefined;
    categoryIds: number[] | undefined;
}> => {
    try {
        const result = await db.raw(
            `
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
        return {
            incomeIds: result.rows[0].incomeIds ?? [],
            accountIds: result.rows[0].accountIds ?? [],
            categoryIds: result.rows[0].categoryIds ?? [],
        };
    } catch (e) {
        Logger.Of('resolveAccessibleItems').error((e as { message: string }).message);
        return { incomeIds: undefined, accountIds: undefined, categoryIds: undefined };
    }
};

export const resolveOwnAccessibleItems = async (
    db: Knex,
    userId: number,
): Promise<{
    incomeIds: number[] | undefined;
    accountIds: number[] | undefined;
    categoryIds: number[] | undefined;
}> => {
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
        return {
            incomeIds: result.rows[0].incomeIds ?? [],
            accountIds: result.rows[0].accountIds ?? [],
            categoryIds: result.rows[0].categoryIds ?? [],
        };
    } catch (e) {
        Logger.Of('resolveOwnAccessibleItems').error((e as { message: string }).message);
        return { incomeIds: undefined, accountIds: undefined, categoryIds: undefined };
    }
};

export const assertAccessibleIds = (ids: number[] | undefined, entity: 'accounts' | 'incomes' | 'categories'): number[] => {
    if (ids === undefined) {
        throw new ValidationError({
            message: `Failed to resolve accessible ${entity}- cannot continue`,
            errorCode: ErrorCode.GROUP_SHARED_ERROR,
        });
    }
    return ids;
};
