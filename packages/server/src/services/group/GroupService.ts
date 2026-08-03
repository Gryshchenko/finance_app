import { ErrorCode, Utils } from '@tenpercent/shared';

import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ICreateGroup, IGroup, IGroupListItem } from 'interfaces/IGroup';
import { IGroupDataAccess } from 'services/group/GroupDataAccess';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { getOnlyNotEmptyProperties } from 'src/utils/validation/getOnlyNotEmptyProperties';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

export interface IGroupService {
    createGroup(userId: number, group: ICreateGroup, trx?: IDBTransaction): Promise<IGroup>;
    getGroups(userId: number): Promise<IGroupListItem[]>;
    getGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<IGroup>;
    patchGroup(userId: number, userGroupId: number, properties: Partial<ICreateGroup>, trx?: IDBTransaction): Promise<number>;
    deleteGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<boolean>;
}

export default class GroupService extends LoggerBase implements IGroupService {
    private readonly _groupDataAccess: IGroupDataAccess;

    public constructor(groupDataAccess: IGroupDataAccess) {
        super();
        this._groupDataAccess = groupDataAccess;
    }

    public async createGroup(userId: number, group: ICreateGroup, trx?: IDBTransaction): Promise<IGroup> {
        if (Utils.isNull(userId)) {
            throw new ValidationError({ message: 'userId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        validateAllowedProperties(group as unknown as Record<string, string | number>, ['groupName', 'description']);
        if (Utils.isEmpty(group.groupName)) {
            throw new ValidationError({ message: 'groupName cant be empty', errorCode: ErrorCode.GROUP_ERROR });
        }
        const created = await this._groupDataAccess.createGroup(userId, group, trx);
        return { ...created, groupSharedItems: [] };
    }

    public async getGroups(userId: number): Promise<IGroupListItem[]> {
        if (Utils.isNull(userId)) {
            throw new ValidationError({ message: 'userId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        return await this._groupDataAccess.getGroups(userId);
    }

    public async getGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<IGroup> {
        if (Utils.isNull(userId)) {
            throw new ValidationError({ message: 'userId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        if (Utils.isNull(userGroupId)) {
            throw new ValidationError({ message: 'userGroupId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        const group = await this._groupDataAccess.getGroup(userId, userGroupId, trx);
        if (Utils.isNull(group)) {
            throw new NotFoundError({
                message: `Group ${userGroupId} not found for userId: ${userId}`,
                errorCode: ErrorCode.GROUP_ERROR,
            });
        }
        return { ...(group as IGroup), groupSharedItems: [] };
    }

    public async patchGroup(
        userId: number,
        userGroupId: number,
        properties: Partial<ICreateGroup>,
        trx?: IDBTransaction,
    ): Promise<number> {
        if (Utils.isNull(userId)) {
            throw new ValidationError({ message: 'userId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        if (Utils.isNull(userGroupId)) {
            throw new ValidationError({ message: 'userGroupId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        validateAllowedProperties(properties as unknown as Record<string, string | number>, ['groupName', 'description']);
        const notEmptyProperties = getOnlyNotEmptyProperties(properties as Record<string, unknown>, ['groupName', 'description']);
        if (Object.keys(notEmptyProperties).length === 0) {
            throw new ValidationError({ message: 'Patch group failed due reason: empty body', errorCode: ErrorCode.GROUP_ERROR });
        }
        return await this._groupDataAccess.patchGroup(userId, userGroupId, notEmptyProperties as Partial<ICreateGroup>, trx);
    }

    public async deleteGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<boolean> {
        if (Utils.isNull(userId)) {
            throw new ValidationError({ message: 'userId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        if (Utils.isNull(userGroupId)) {
            throw new ValidationError({ message: 'userGroupId cant be null', errorCode: ErrorCode.GROUP_ERROR });
        }
        return await this._groupDataAccess.deleteGroup(userId, userGroupId, trx);
    }
}
