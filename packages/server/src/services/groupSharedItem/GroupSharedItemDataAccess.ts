import { ErrorCode, IGroupSharedItem, Utils } from '@tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { ValidationError } from 'src/utils/errors/ValidationError';

export interface IGroupSharedItemDataAccess {
    shareItem(
        userId: number,
        userGroupId: number,
        items: { accountIds?: number[]; incomeIds?: number[]; categoryIds?: number[] },
        trx?: IDBTransaction,
    ): Promise<void>;
    unshareItem(
        userId: number,
        userGroupId: number,
        items: { accountIds?: number[]; incomeIds?: number[]; categoryIds?: number[] },
        trx?: IDBTransaction,
    ): Promise<void>;
    getShareItems(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<IGroupSharedItem[] | []>;
    getShareableItems(userId: number): Promise<IGroupSharedItem[] | []>;
    deleteSharedItemsForGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<void>;
}

export default class GroupSharedItemDataAccess extends LoggerBase implements IGroupSharedItemDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    async shareItem(
        userId: number,
        userGroupId: number,
        items: { accountIds?: number[]; incomeIds?: number[]; categoryIds?: number[] },
        trx: IDBTransaction,
    ): Promise<void> {
        try {
            const buildQuery = async (
                query: IDBTransaction,
                entityKey: 'accountId' | 'incomeId' | 'categoryId',
                entityTableName: 'accounts' | 'incomes' | 'categories',
                ids: { userId: number; userGroupId: number; [key: string]: number }[],
            ): Promise<unknown> => {
                if (entityKey !== 'incomeId' && entityKey !== 'accountId' && entityKey !== 'categoryId') {
                    throw new DBError({
                        message: 'Invalid entity key',
                        errorCode: ErrorCode.GROUP_SHARED_ERROR,
                    });
                }
                if (entityTableName !== 'accounts' && entityTableName !== 'incomes' && entityTableName !== 'categories') {
                    throw new DBError({
                        message: 'Invalid entity table name',
                        errorCode: ErrorCode.GROUP_SHARED_ERROR,
                    });
                }
                const uniqueIds = new Set(ids.map((data) => Number(data[entityKey])));
                if (uniqueIds.size === 0) return;
                const inserted = await query.raw(
                    `
                                INSERT INTO groupshareditem ("userId", "userGroupId", "${entityKey}")
                                SELECT 
                                ?, 
                                ?,
                                "${entityKey}"
                              FROM ${entityTableName} 

                              WHERE "userId" = ? AND "${entityKey}" in (${ids.map(() => '?').join(',')})
                              ON CONFLICT ("userId", "userGroupId", "${entityKey}")
                              DO UPDATE set "updatedAt" = now()
                              RETURNING "sharedItemId"
                              `,
                    [userId, userGroupId, userId, ...uniqueIds],
                );
                if (inserted.rows.length !== uniqueIds.size) {
                    throw new ValidationError({
                        message: `Some ${entityTableName} not belong to current user`,
                        errorCode: ErrorCode.GROUP_SHARED_ERROR,
                    });
                }
                return inserted;
            };
            this._logger.info('Create shared item group');
            const incomes = items.incomeIds?.map((incomeId) => ({ userId, userGroupId, incomeId })) ?? [];
            const accounts = items.accountIds?.map((accountId) => ({ userId, userGroupId, accountId })) ?? [];
            const categories = items.categoryIds?.map((categoryId) => ({ userId, userGroupId, categoryId })) ?? [];
            const query = trx;
            await buildQuery(query, 'accountId', 'accounts', accounts);
            await buildQuery(query, 'incomeId', 'incomes', incomes);
            await buildQuery(query, 'categoryId', 'categories', categories);

            return undefined;
        } catch (e) {
            throw new DBError({
                message: `Failed to create shared item for userId: ${userId}. Error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.GROUP_SHARED_ERROR,
            });
        }
    }

    async unshareItem(
        userId: number,
        userGroupId: number,
        items: { accountIds?: number[]; incomeIds?: number[]; categoryIds?: number[] },
        trx: IDBTransaction,
    ): Promise<void> {
        try {
            this._logger.info('Delete shared item group');
            const incomes = items.incomeIds?.map((incomeId) => ({ userId, userGroupId, incomeId })) ?? [];
            const accounts = items.accountIds?.map((accountId) => ({ userId, userGroupId, accountId })) ?? [];
            const categories = items.categoryIds?.map((categoryId) => ({ userId, userGroupId, categoryId })) ?? [];
            const query = trx;
            const raw = query('groupshareditem');
            raw.where((builder) => {
                if (Utils.isArrayNotEmpty(incomes)) {
                    builder.orWhereRaw(
                        `("userId", "userGroupId", "incomeId") IN (${incomes.map(() => '(?, ?, ?)').join(', ')})`,
                        incomes.flatMap((e) => [Number(e.userId), Number(e.userGroupId), Number(e.incomeId)]),
                    );
                }
                if (Utils.isArrayNotEmpty(accounts)) {
                    builder.orWhereRaw(
                        `("userId", "userGroupId", "accountId") IN (${accounts.map(() => '(?, ?, ?)').join(', ')})`,
                        accounts.flatMap((e) => [Number(e.userId), Number(e.userGroupId), Number(e.accountId)]),
                    );
                }
                if (Utils.isArrayNotEmpty(categories)) {
                    builder.orWhereRaw(
                        `("userId", "userGroupId", "categoryId") IN (${categories.map(() => '(?, ?, ?)').join(', ')})`,
                        categories.flatMap((e) => [Number(e.userId), Number(e.userGroupId), Number(e.categoryId)]),
                    );
                }
            });
            await raw.delete();
        } catch (e) {
            throw new DBError({
                message: `Failed to unshare item for userId: ${userId}. Error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.GROUP_SHARED_ERROR,
            });
        }
    }

    async getShareableItems(userId: number): Promise<IGroupSharedItem[] | []> {
        try {
            this._logger.info('Get shareable items');
            const data = await this._db.engine().raw(
                `
                   SELECT a."accountId" as id, 'account' as type, a."accountName" as name, false as "isShared"
                   FROM accounts as a WHERE a."userId" = ?
                   UNION ALL
                   SELECT i."incomeId" as id, 'income' as type, i."incomeName" as name, false as "isShared"
                   FROM incomes as i WHERE i."userId" = ?
                   UNION ALL
                   SELECT c."categoryId" as id, 'category' as type, c."categoryName" as name, false as "isShared"
                   FROM categories as c WHERE c."userId" = ?
                   ORDER BY type, name
                `,
                [userId, userId, userId],
            );
            return data.rows as IGroupSharedItem[];
        } catch (e) {
            throw new DBError({
                message: `Failed to get shareable items for userId: ${userId}. Error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.GROUP_SHARED_ERROR,
            });
        }
    }

    async getShareItems(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<IGroupSharedItem[] | []> {
        try {
            this._logger.info('Get shared item group');
            const data = await (trx || this._db.engine()).raw(
                `
                   SELECT
                       a."accountId" as id,
                       'account' as type,
                        a."accountName" as name,
                        (gsi."sharedItemId" IS NOT NULL) as "isShared"
                   FROM accounts as a 
                   LEFT JOIN groupshareditem as gsi ON a."accountId" = gsi."accountId" AND gsi."userGroupId" = ?
                   WHERE a."userId" = ?
                   UNION ALL
                   SELECT
                       i."incomeId" as id,
                       'income' as type,
                       i."incomeName" as name,
                       (gsi."sharedItemId" IS NOT NULL) as "isShared"
                   FROM incomes as i
                   LEFT JOIN groupshareditem as gsi ON i."incomeId" = gsi."incomeId" AND gsi."userGroupId" = ?
                   WHERE i."userId" = ?
                   UNION ALL
                   SELECT
                       c."categoryId" as id,
                       'category' as type,
                       c."categoryName" as name,
                       (gsi."sharedItemId" IS NOT NULL) as "isShared"
                   FROM categories as c
                            LEFT JOIN groupshareditem as gsi ON c."categoryId" = gsi."categoryId" AND gsi."userGroupId" = ?
                   WHERE c."userId" = ?
                   
                   ORDER BY type, name
                `,
                [userGroupId, userId, userGroupId, userId, userGroupId, userId],
            );
            return data.rows as IGroupSharedItem[];
        } catch (e) {
            throw new DBError({
                message: `Failed to get shared items for userId: ${userId}. Error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.GROUP_SHARED_ERROR,
            });
        }
    }
    public async deleteSharedItemsForGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<void> {
        try {
            this._logger.info(`Deleting shared items for userGroupId: ${userGroupId}`);
            const query = trx || this._db.engine();
            await query('groupshareditem').where({ userId, userGroupId }).delete();
            this._logger.info(`Deleted shared items for userGroupId: ${userGroupId}`);
        } catch (e) {
            this._logger.error(
                `Failed to delete shared items for userGroupId: ${userGroupId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Deleting shared items failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.GROUP_SHARED_ERROR,
            });
        }
    }
}
