import { Knex } from 'knex';

import Logger from 'helper/logger/Logger';
import { ConnectionStatus } from 'types/ConnectionStatus';

export const resolveAccessibleItems = async (
    db: Knex,
    type: 'accounts' | 'incomes' | 'categories',
    userId: number,
): Promise<number[] | undefined> => {
    try {
        const types = {
            incomes: 'incomeId',
            categories: 'categoryId',
            accounts: 'accountId',
        };
        const activeType = types[type];
        if (!activeType) {
            throw new Error(`No active type: ${type}`);
        }
        const result = await db.raw(
            `
                    select
                        array_agg(DISTINCT g.?? ) as ids
                    from groupshareditem g 
                    where g."userGroupId" in (
                        select unnest(array[u."userGroupId", u."memberUserGroupId"]) as ids from userconnections u where u."memberUserId" = ? and u.status = ?
                        union
                        select unnest(array[u."userGroupId", u."memberUserGroupId"]) as ids from userconnections u where u."ownerUserId" = ? and u.status = ?
                    )  and g.?? IS NOT NULL
                `,
            [activeType, userId, ConnectionStatus.Connected, userId, ConnectionStatus.Connected, activeType],
        );
        return result.rows[0].ids || [];
    } catch (e) {
        Logger.Of('resolveAccessibleItems').error((e as { message: string }).message);
        return undefined;
    }
};
