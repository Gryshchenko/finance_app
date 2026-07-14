import { ErrorCode, IConnectedMember, IPendingConnectionRequest } from '@tenpercent/shared';

import { IConnection } from 'interfaces/IConnection';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IGroupInvitation } from 'interfaces/IGroupInvitation';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { ConnectionStatus } from 'types/ConnectionStatus';
import { InvitationStatus } from 'types/InvitationStatus';

export interface IConnectionDataAccess {
    createRequest(requesterUserId: number, ownerUserId: number, trx?: IDBTransaction): Promise<IConnection>;
    getConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<IConnection | undefined>;
    getConnectedMembers(ownerUserId: number): Promise<IConnectedMember[]>;
    getPendingRequests(ownerUserId: number): Promise<IPendingConnectionRequest[]>;
    updateConnection(
        ownerUserId: number,
        connectionId: number,
        properties: Partial<{ status: ConnectionStatus; userGroupId: number | null }>,
        trx?: IDBTransaction,
    ): Promise<number>;
    deleteConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<boolean>;
    clearGroupFromConnections(ownerUserId: number, userGroupId: number, trx?: IDBTransaction): Promise<number>;
    createInvitation(userGroupId: number, invitedEmail: string, trx?: IDBTransaction): Promise<IGroupInvitation>;
    deleteInvitationsForGroup(userGroupId: number, trx?: IDBTransaction): Promise<number>;
}

export default class ConnectionDataAccess extends LoggerBase implements IConnectionDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async createRequest(requesterUserId: number, ownerUserId: number, trx?: IDBTransaction): Promise<IConnection> {
        try {
            this._logger.info(`Creating connection request from userId: ${requesterUserId} to ownerUserId: ${ownerUserId}`);
            const query = trx || this._db.engine();
            const data = await query('userconnections').insert(
                {
                    ownerUserId,
                    memberUserId: requesterUserId,
                    status: ConnectionStatus.Pending,
                },
                ['connectionId', 'ownerUserId', 'memberUserId', 'userGroupId', 'status'],
            );
            this._logger.info(`Created connection request ${data[0].connectionId} for ownerUserId: ${ownerUserId}`);
            return data[0];
        } catch (e) {
            this._logger.error(
                `Failed to create connection request for ownerUserId: ${ownerUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Creating connection request failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async getConnection(
        ownerUserId: number,
        connectionId: number,
        trx?: IDBTransaction,
    ): Promise<IConnection | undefined> {
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

    public async getConnectedMembers(ownerUserId: number): Promise<IConnectedMember[]> {
        try {
            this._logger.info(`Fetching connected members for ownerUserId: ${ownerUserId}`);
            const query = this._db.engine();
            const data = await query('userconnections')
                .select(
                    'userconnections.connectionId',
                    'userconnections.memberUserId as userId',
                    'profiles.publicName',
                    'users.email',
                    'userconnections.userGroupId',
                )
                .innerJoin('users', 'users.userId', 'userconnections.memberUserId')
                .leftJoin('profiles', 'profiles.userId', 'userconnections.memberUserId')
                .where({
                    'userconnections.ownerUserId': ownerUserId,
                    'userconnections.status': ConnectionStatus.Connected,
                })
                .orderBy('userconnections.connectionId', 'asc');
            this._logger.info(`Fetched ${data.length} connected members for ownerUserId: ${ownerUserId}`);
            return data;
        } catch (e) {
            this._logger.error(
                `Failed to fetch connected members for ownerUserId: ${ownerUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching connected members failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async getPendingRequests(ownerUserId: number): Promise<IPendingConnectionRequest[]> {
        try {
            this._logger.info(`Fetching pending connection requests for ownerUserId: ${ownerUserId}`);
            const query = this._db.engine();
            const data = await query('userconnections')
                .select(
                    'userconnections.connectionId',
                    'userconnections.memberUserId as userId',
                    'profiles.publicName',
                    'users.email',
                    'userconnections.createdAt',
                )
                .innerJoin('users', 'users.userId', 'userconnections.memberUserId')
                .leftJoin('profiles', 'profiles.userId', 'userconnections.memberUserId')
                .where({
                    'userconnections.ownerUserId': ownerUserId,
                    'userconnections.status': ConnectionStatus.Pending,
                })
                .orderBy('userconnections.createdAt', 'desc');
            this._logger.info(`Fetched ${data.length} pending requests for ownerUserId: ${ownerUserId}`);
            return data;
        } catch (e) {
            this._logger.error(
                `Failed to fetch pending requests for ownerUserId: ${ownerUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching pending requests failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async updateConnection(
        ownerUserId: number,
        connectionId: number,
        properties: Partial<{ status: ConnectionStatus; userGroupId: number | null }>,
        trx?: IDBTransaction,
    ): Promise<number> {
        try {
            this._logger.info(`Updating connection ${connectionId} for ownerUserId: ${ownerUserId}`);
            const query = trx || this._db.engine();
            const updated = await query('userconnections')
                .update({ ...properties, updatedAt: new Date() })
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

    public async clearGroupFromConnections(ownerUserId: number, userGroupId: number, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Clearing group ${userGroupId} from connections for ownerUserId: ${ownerUserId}`);
            const query = trx || this._db.engine();
            const updated = await query('userconnections')
                .update({ userGroupId: null, updatedAt: new Date() })
                .where({ ownerUserId, userGroupId });
            this._logger.info(`Cleared group ${userGroupId} from ${updated} connections for ownerUserId: ${ownerUserId}`);
            return updated;
        } catch (e) {
            this._logger.error(
                `Failed to clear group ${userGroupId} from connections for ownerUserId: ${ownerUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Clearing group from connections failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async createInvitation(userGroupId: number, invitedEmail: string, trx?: IDBTransaction): Promise<IGroupInvitation> {
        try {
            this._logger.info(`Creating invitation for userGroupId: ${userGroupId}`);
            const query = trx || this._db.engine();
            const data = await query('groupinvitations').insert(
                {
                    userGroupId,
                    invitedEmail,
                    status: InvitationStatus.Pending,
                },
                ['invitationId', 'userGroupId', 'invitedEmail', 'status'],
            );
            this._logger.info(`Created invitation ${data[0].invitationId} for userGroupId: ${userGroupId}`);
            return data[0];
        } catch (e) {
            this._logger.error(
                `Failed to create invitation for userGroupId: ${userGroupId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Creating invitation failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async deleteInvitationsForGroup(userGroupId: number, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Deleting invitations for userGroupId: ${userGroupId}`);
            const query = trx || this._db.engine();
            const deleted = await query('groupinvitations').delete().where({ userGroupId });
            this._logger.info(`Deleted ${deleted} invitations for userGroupId: ${userGroupId}`);
            return deleted;
        } catch (e) {
            this._logger.error(
                `Failed to delete invitations for userGroupId: ${userGroupId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Deleting invitations failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }
}
