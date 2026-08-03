import { ErrorCode, ISentConnectionRequest } from '@tenpercent/shared';

import { IConnection } from 'interfaces/IConnection';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { validateConnectionId } from 'services/connection/connectionValidation';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { ConnectionStatus } from 'types/ConnectionStatus';

export interface IConnectionOwnerDataAccess {
    inviteMember(ownerUserId: number, memberUserId: number, userGroupId: number, trx?: IDBTransaction): Promise<IConnection>;
    getConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<IConnection | undefined>;
    updateGroup(ownerUserId: number, connectionId: number, userGroupId: number | null, trx?: IDBTransaction): Promise<number>;
    deleteConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<boolean>;
    getSentRequests(memberUserId: number): Promise<ISentConnectionRequest[]>;
}

export default class ConnectionOwnerDataAccess extends LoggerBase implements IConnectionOwnerDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async inviteMember(
        ownerUserId: number,
        memberUserId: number,
        userGroupId: number,
        trx?: IDBTransaction,
    ): Promise<IConnection> {
        validateConnectionId(ownerUserId, 'ownerUserId');
        validateConnectionId(memberUserId, 'memberUserId');
        validateConnectionId(userGroupId, 'userGroupId');
        if (ownerUserId === memberUserId) {
            throw new DBError({
                message: 'ownerUserId and memberUserId cant be the same',
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        try {
            this._logger.info(`Creating invite from ownerUserId: ${ownerUserId} to memberUserId: ${memberUserId}`);
            const query = trx || this._db.engine();
            const data = await query('userconnections').insert(
                {
                    ownerUserId,
                    memberUserId,
                    userGroupId,
                    status: ConnectionStatus.Pending,
                },
                ['connectionId', 'ownerUserId', 'memberUserId', 'userGroupId', 'status'],
            );
            this._logger.info(`Created invite ${data[0].connectionId} for ownerUserId: ${ownerUserId}`);
            return data[0];
        } catch (e) {
            this._logger.error(
                `Failed to create invite for ownerUserId: ${ownerUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Creating invite failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async getConnection(
        ownerUserId: number,
        connectionId: number,
        trx?: IDBTransaction,
    ): Promise<IConnection | undefined> {
        validateConnectionId(ownerUserId, 'ownerUserId');
        validateConnectionId(connectionId, 'connectionId');
        try {
            this._logger.info(`Fetching connection ${connectionId} for ownerUserId: ${ownerUserId}`);
            const query = trx || this._db.engine();
            const data = await query('userconnections')
                .select('connectionId', 'ownerUserId', 'memberUserId', 'userGroupId', 'status')
                .where({ ownerUserId, connectionId })
                .first();
            return data || undefined;
        } catch (e) {
            this._logger.error(
                `Failed to fetch connection ${connectionId} for ownerUserId: ${ownerUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching connection failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async getSentRequests(ownerUserId: number): Promise<ISentConnectionRequest[]> {
        validateConnectionId(ownerUserId, 'ownerUserId');
        try {
            this._logger.info(`Fetching sent connection requests for ownerUserId: ${ownerUserId}`);
            const query = this._db.engine();
            const data = await query('userconnections')
                .select('userconnections.connectionId', 'users.email', 'userconnections.createdAt')
                .innerJoin('users', 'users.userId', 'userconnections.memberUserId')
                .leftJoin('profiles', 'profiles.userId', 'userconnections.memberUserId')
                .where({
                    'userconnections.ownerUserId': ownerUserId,
                    'userconnections.status': ConnectionStatus.Pending,
                })
                .orderBy('userconnections.createdAt', 'desc');
            this._logger.info(`Fetched ${data.length} sent requests for ownerUserId: ${ownerUserId}`);
            return data;
        } catch (e) {
            this._logger.error(
                `Failed to fetch sent requests for ownerUserId: ${ownerUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching sent requests failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async updateGroup(
        ownerUserId: number,
        connectionId: number,
        userGroupId: number | null,
        trx?: IDBTransaction,
    ): Promise<number> {
        validateConnectionId(ownerUserId, 'ownerUserId');
        validateConnectionId(connectionId, 'connectionId');
        if (userGroupId !== null) {
            validateConnectionId(userGroupId, 'userGroupId');
        }
        try {
            this._logger.info(`Updating group of connection ${connectionId} for ownerUserId: ${ownerUserId}`);
            const query = trx || this._db.engine();
            const updated = await query('userconnections')
                .update({ userGroupId, updatedAt: new Date() })
                .where({ ownerUserId, connectionId });
            this._logger.info(`Updated connection ${connectionId} for ownerUserId: ${ownerUserId}, updated rows: ${updated}`);
            return updated;
        } catch (e) {
            this._logger.error(
                `Failed to update connection ${connectionId} for ownerUserId: ${ownerUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Updating connection failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async deleteConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<boolean> {
        validateConnectionId(ownerUserId, 'ownerUserId');
        validateConnectionId(connectionId, 'connectionId');
        try {
            this._logger.info(`Deleting connection ${connectionId} for ownerUserId: ${ownerUserId}`);
            const query = trx || this._db.engine();
            const deleted = await query('userconnections').delete().where({ ownerUserId, connectionId });
            this._logger.info(`Deleted connection ${connectionId} for ownerUserId: ${ownerUserId}, deleted rows: ${deleted}`);
            return deleted > 0;
        } catch (e) {
            this._logger.error(
                `Failed to delete connection ${connectionId} for ownerUserId: ${ownerUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Deleting connection failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }
}
