import { ErrorCode } from '@tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ICreateGroup, IGroup, IGroupListItem } from 'interfaces/IGroup';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { ConnectionStatus } from 'types/ConnectionStatus';

export interface IGroupDataAccess {
    createGroup(userId: number, group: Omit<ICreateGroup, 'groupSharedItems'>, trx?: IDBTransaction): Promise<IGroup>;
    getGroups(userId: number): Promise<IGroupListItem[]>;
    getGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<IGroup | undefined>;
    patchGroup(
        userId: number,
        userGroupId: number,
        properties: Partial<Omit<ICreateGroup, 'groupSharedItems'>>,
        trx?: IDBTransaction,
    ): Promise<number>;
    deleteGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<boolean>;
}

export default class GroupDataAccess extends LoggerBase implements IGroupDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async createGroup(userId: number, group: ICreateGroup, trx?: IDBTransaction): Promise<IGroup> {
        try {
            this._logger.info(`Starting group creation for userId: ${userId}`);
            const query = trx || this._db.engine();
            const data = await query('usergroups').insert(
                { userId, groupName: group.groupName, description: group.description ?? null },
                ['userGroupId', 'userId', 'groupName', 'description'],
            );
            this._logger.info(`Successfully created ${data[0].userGroupId} group for userId: ${userId}`);
            return data[0];
        } catch (e) {
            this._logger.error(`Failed to create group for userId: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Creating group failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.GROUP_ERROR,
            });
        }
    }

    public async getGroups(userId: number): Promise<IGroupListItem[]> {
        try {
            this._logger.info(`Fetching groups for userId: ${userId}`);
            const query = this._db.engine();
            const data = await query('usergroups')
                .select(
                    'usergroups.userGroupId',
                    'usergroups.userId',
                    'usergroups.groupName',
                    'usergroups.description',
                    query.raw(
                        'count("userconnections"."connectionId") filter (where "userconnections"."status" = ?)::int as "memberCount"',
                        [ConnectionStatus.Connected],
                    ),
                )
                .leftJoin('userconnections', 'userconnections.userGroupId', 'usergroups.userGroupId')
                .where({ 'usergroups.userId': userId })
                .groupBy('usergroups.userGroupId')
                .orderBy('usergroups.userGroupId', 'asc');
            this._logger.info(`Fetched ${data.length} groups for userId: ${userId}`);
            return data;
        } catch (e) {
            this._logger.error(`Failed to fetch groups for userId: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Fetching groups failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.GROUP_ERROR,
            });
        }
    }

    public async getGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<IGroup | undefined> {
        try {
            this._logger.info(`Fetching group ${userGroupId} for userId: ${userId}`);
            const query = trx || this._db.engine();
            const data = await query('usergroups')
                .select('userGroupId', 'userId', 'groupName', 'description')
                .where({ userId, userGroupId })
                .first();
            return data || undefined;
        } catch (e) {
            this._logger.error(
                `Failed to fetch group ${userGroupId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching group failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.GROUP_ERROR,
            });
        }
    }

    public async patchGroup(
        userId: number,
        userGroupId: number,
        properties: Partial<ICreateGroup>,
        trx?: IDBTransaction,
    ): Promise<number> {
        try {
            this._logger.info(`Patching group ${userGroupId} for userId: ${userId}`);
            const query = trx || this._db.engine();
            const updated = await query('usergroups')
                .update({ ...properties, updatedAt: new Date() })
                .where({ userId, userGroupId });
            this._logger.info(`Patched group ${userGroupId} for userId: ${userId}, updated rows: ${updated}`);
            return updated;
        } catch (e) {
            this._logger.error(
                `Failed to patch group ${userGroupId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Patching group failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.GROUP_ERROR,
            });
        }
    }

    public async deleteGroup(userId: number, userGroupId: number, trx?: IDBTransaction): Promise<boolean> {
        try {
            this._logger.info(`Deleting group ${userGroupId} for userId: ${userId}`);
            const query = trx || this._db.engine();
            const deleted = await query('usergroups').delete().where({ userId, userGroupId });
            this._logger.info(`Deleted group ${userGroupId} for userId: ${userId}, deleted rows: ${deleted}`);
            return deleted > 0;
        } catch (e) {
            this._logger.error(
                `Failed to delete group ${userGroupId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Deleting group failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.GROUP_ERROR,
            });
        }
    }
}
