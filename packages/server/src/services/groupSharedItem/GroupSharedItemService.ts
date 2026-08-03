import { ErrorCode, IGroupSharedItem, Utils } from '@tenpercent/shared';

import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IGroupSharedItemDataAccess } from 'services/groupSharedItem/GroupSharedItemDataAccess';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ValidationError } from 'src/utils/errors/ValidationError';

export interface IGroupSharedItemService {
    shareItem(
        userId: number,
        shareGroupId: number,
        items: { accountIds?: number[]; incomeIds?: number[]; categoryIds?: number[] },
        trx?: IDBTransaction,
    ): Promise<void>;
    unshareItem(
        userId: number,
        shareGroupId: number,
        items: { accountIds?: number[]; incomeIds?: number[]; categoryIds?: number[] },
        trx?: IDBTransaction,
    ): Promise<void>;
    getShareItems(userId: number, shareGroupId: number, trx?: IDBTransaction): Promise<IGroupSharedItem[] | []>;
    getShareableItems(userId: number): Promise<IGroupSharedItem[] | []>;
    deleteSharedItemsForGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<void>;
}

export default class GroupSharedItemService extends LoggerBase implements IGroupSharedItemService {
    private readonly _groupSharedItemDataAccess: IGroupSharedItemDataAccess;

    public constructor(groupSharedItemDataAccess: IGroupSharedItemDataAccess) {
        super();
        this._groupSharedItemDataAccess = groupSharedItemDataAccess;
    }

    async shareItem(
        userId: number,
        shareGroupId: number,
        items: { accountIds?: number[]; incomeIds?: number[]; categoryIds?: number[] },
        trx?: IDBTransaction,
    ): Promise<void> {
        const incomes = items.incomeIds?.map((incomeId) => ({ userId, shareGroupId, incomeId })) ?? [];
        const accounts = items.accountIds?.map((accountId) => ({ userId, shareGroupId, accountId })) ?? [];
        const categories = items.categoryIds?.map((categoryId) => ({ userId, shareGroupId, categoryId })) ?? [];
        const entities = [...incomes, ...accounts, ...categories];
        if (Utils.isArrayEmpty(entities)) {
            throw new ValidationError({
                message: 'No items to share',
                errorCode: ErrorCode.GROUP_SHARED_ERROR,
            });
        }
        return await this._groupSharedItemDataAccess.shareItem(userId, shareGroupId, items, trx);
    }

    async unshareItem(
        userId: number,
        shareGroupId: number,
        items: { accountIds?: number[]; incomeIds?: number[]; categoryIds?: number[] },
        trx?: IDBTransaction,
    ): Promise<void> {
        const incomes = items.incomeIds?.map((incomeId) => ({ userId, shareGroupId, incomeId })) ?? [];
        const accounts = items.accountIds?.map((accountId) => ({ userId, shareGroupId, accountId })) ?? [];
        const categories = items.categoryIds?.map((categoryId) => ({ userId, shareGroupId, categoryId })) ?? [];
        const entities = [...incomes, ...accounts, ...categories];
        if (Utils.isArrayEmpty(entities)) {
            throw new ValidationError({
                message: 'No items to unshare',
                errorCode: ErrorCode.GROUP_SHARED_ERROR,
            });
        }
        return await this._groupSharedItemDataAccess.unshareItem(userId, shareGroupId, items, trx);
    }

    async getShareItems(userId: number, shareGroupId: number, trx?: IDBTransaction): Promise<IGroupSharedItem[]> {
        return await this._groupSharedItemDataAccess.getShareItems(userId, shareGroupId, trx);
    }

    async getShareableItems(userId: number): Promise<IGroupSharedItem[]> {
        return await this._groupSharedItemDataAccess.getShareableItems(userId);
    }

    async deleteSharedItemsForGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<void> {
        return await this._groupSharedItemDataAccess.deleteSharedItemsForGroup(userId, userGroupId, trx);
    }
}
