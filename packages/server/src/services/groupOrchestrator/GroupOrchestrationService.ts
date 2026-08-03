import { ErrorCode, HttpCode, IGroupSharedItem, Utils } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ICreateGroup, IGroup } from 'interfaces/IGroup';
import { IConnectionService } from 'services/connection/ConnectionService';
import { IGroupService } from 'services/group/GroupService';
import { IGroupSharedItemService } from 'services/groupSharedItem/GroupSharedItemService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { getOnlyNotEmptyProperties } from 'src/utils/validation/getOnlyNotEmptyProperties';

export class GroupOrchestrationService extends LoggerBase {
    private readonly _groupService: IGroupService;
    private readonly _groupSharedItemService: IGroupSharedItemService;
    private readonly _connectionService: IConnectionService;

    constructor({
        groupService,
        groupSharedItemService,
        connectionService,
    }: {
        groupService: IGroupService;
        groupSharedItemService: IGroupSharedItemService;
        connectionService: IConnectionService;
    }) {
        super();
        this._groupService = groupService;
        this._groupSharedItemService = groupSharedItemService;
        this._connectionService = connectionService;
    }

    public async createGroup(userId: number, group: ICreateGroup): Promise<IGroup> {
        const { groupSharedItems, ...groupFields } = group;
        return await this.withTransaction(async (trx: IDBTransaction) => {
            const created = await this._groupService.createGroup(userId, groupFields, trx);
            if (Utils.isArrayNotEmpty(groupSharedItems)) {
                await this.syncSharedItems(userId, created.userGroupId, groupSharedItems, trx);
            }
            return { ...created, groupSharedItems: groupSharedItems ?? [] };
        });
    }

    public async getGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<IGroup> {
        const group = await this._groupService.getGroup(userId, userGroupId, trx);
        const groupSharedItems = await this._groupSharedItemService.getShareItems(userId, userGroupId, trx);
        return { ...group, groupSharedItems };
    }

    public async getShareableItems(userId: number): Promise<IGroupSharedItem[]> {
        if (Utils.isNull(userId)) {
            throw new ValidationError({ message: 'userId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        return await this._groupSharedItemService.getShareableItems(userId);
    }

    public async patchGroup(userId: number, userGroupId: number, properties: Partial<ICreateGroup>): Promise<number> {
        const { groupSharedItems, ...groupFields } = properties;
        const hasGroupFields = Object.keys(getOnlyNotEmptyProperties(groupFields, ['groupName', 'description'])).length > 0;
        const hasSharedItems = Utils.isArrayNotEmpty(groupSharedItems);
        if (!hasGroupFields && !hasSharedItems) {
            throw new ValidationError({ message: 'Patch group failed due reason: empty body', errorCode: ErrorCode.GROUP_ERROR });
        }
        return await this.withTransaction(async (trx: IDBTransaction) => {
            // Ownership guard: getGroup filters by { userId, userGroupId } and throws when the group
            // is not owned by userId. Required because the shared-items-only path below never touches
            // usergroups, so without this a non-owner could write groupshareditem rows into a foreign group.
            await this._groupService.getGroup(userId, userGroupId, trx);
            let updated = 0;
            if (hasGroupFields) {
                updated = await this._groupService.patchGroup(userId, userGroupId, groupFields, trx);
            }
            if (hasSharedItems) {
                await this.syncSharedItems(userId, userGroupId, groupSharedItems as IGroupSharedItem[], trx);
            }
            return updated;
        });
    }

    private async syncSharedItems(
        userId: number,
        userGroupId: number,
        items: IGroupSharedItem[],
        trx: IDBTransaction,
    ): Promise<void> {
        const toShare = { accountIds: [] as number[], incomeIds: [] as number[], categoryIds: [] as number[] };
        const toUnshare = { accountIds: [] as number[], incomeIds: [] as number[], categoryIds: [] as number[] };
        const bucket = { account: 'accountIds', income: 'incomeIds', category: 'categoryIds' } as const;
        for (const item of items) {
            const key = bucket[item.type];
            if (Utils.isNull(key)) {
                throw new ValidationError({
                    message: `Invalid shared item type: ${item.type}`,
                    errorCode: ErrorCode.GROUP_ERROR,
                });
            }
            (item.isShared ? toShare : toUnshare)[key].push(item.id);
        }
        if (toShare.accountIds.length || toShare.incomeIds.length || toShare.categoryIds.length) {
            await this._groupSharedItemService.shareItem(userId, userGroupId, toShare, trx);
        }
        if (toUnshare.accountIds.length || toUnshare.incomeIds.length || toUnshare.categoryIds.length) {
            await this._groupSharedItemService.unshareItem(userId, userGroupId, toUnshare, trx);
        }
    }

    private async withTransaction<T>(processor: (trx: IDBTransaction) => Promise<T>): Promise<T> {
        const db: IDatabaseConnection = DatabaseConnectionBuilder.build();
        const uow = new UnitOfWork(db);
        try {
            await uow.start();
            const trx = uow.getTransaction();
            if (Utils.isNull(trx)) {
                throw new CustomError({
                    message: 'Transaction not initiated',
                    errorCode: ErrorCode.GROUP_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }
            const response = await processor(trx as unknown as IDBTransaction);
            await uow.commit();
            return response;
        } catch (e: unknown) {
            await uow.rollback();
            throw e;
        }
    }

    private async deleteSharedItemsForGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<void> {
        return await this._groupSharedItemService.deleteSharedItemsForGroup(userId, userGroupId, trx);
    }

    public async deleteGroup(userId: number, userGroupId: number): Promise<boolean> {
        if (Utils.isNull(userId)) {
            throw new ValidationError({ message: 'userId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        if (Utils.isNull(userGroupId)) {
            throw new ValidationError({ message: 'userGroupId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        const connectedMembers = await this._connectionService.getConnectedMembersCount(userId, userGroupId);
        if (connectedMembers > 0) {
            throw new ValidationError({
                message: `Group ${userGroupId} has ${connectedMembers} connected members, cannot delete`,
                errorCode: ErrorCode.GROUP_DELETE_WITH_MEMBERS_ERROR,
            });
        }
        return await this.withTransaction(async (trx: IDBTransaction) => {
            await this._groupService.getGroup(userId, userGroupId, trx);
            await this.deleteSharedItemsForGroup(userId, userGroupId, trx);
            return await this._groupService.deleteGroup(userId, userGroupId, trx);
        });
    }
}
