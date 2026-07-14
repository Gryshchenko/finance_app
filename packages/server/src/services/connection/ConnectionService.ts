import { ErrorCode, IConnectedMember, IPendingConnectionRequest, Utils } from '@tenpercent/shared';

import { IConnection } from 'interfaces/IConnection';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IGroupInvitation } from 'interfaces/IGroupInvitation';
import { IConnectionDataAccess } from 'services/connection/ConnectionDataAccess';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { ConnectionStatus } from 'types/ConnectionStatus';

export interface IConnectionService {
    createRequest(requesterUserId: number, ownerUserId: number, trx?: IDBTransaction): Promise<IConnection>;
    getConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<IConnection>;
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

export default class ConnectionService extends LoggerBase implements IConnectionService {
    private readonly _connectionDataAccess: IConnectionDataAccess;

    public constructor(connectionDataAccess: IConnectionDataAccess) {
        super();
        this._connectionDataAccess = connectionDataAccess;
    }

    public async createRequest(requesterUserId: number, ownerUserId: number, trx?: IDBTransaction): Promise<IConnection> {
        if (Utils.isNull(requesterUserId)) {
            throw new ValidationError({ message: 'requesterUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (requesterUserId === ownerUserId) {
            throw new ValidationError({
                message: 'requesterUserId and ownerUserId cant be the same',
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        return await this._connectionDataAccess.createRequest(requesterUserId, ownerUserId, trx);
    }

    public async getConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<IConnection> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        const connection = await this._connectionDataAccess.getConnection(ownerUserId, connectionId, trx);
        if (Utils.isNull(connection)) {
            throw new NotFoundError({
                message: `Connection ${connectionId} not found for ownerUserId: ${ownerUserId}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        return connection as IConnection;
    }

    public async getConnectedMembers(ownerUserId: number): Promise<IConnectedMember[]> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._connectionDataAccess.getConnectedMembers(ownerUserId);
    }

    public async getPendingRequests(ownerUserId: number): Promise<IPendingConnectionRequest[]> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._connectionDataAccess.getPendingRequests(ownerUserId);
    }

    public async updateConnection(
        ownerUserId: number,
        connectionId: number,
        properties: Partial<{ status: ConnectionStatus; userGroupId: number | null }>,
        trx?: IDBTransaction,
    ): Promise<number> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Object.keys(properties).length === 0) {
            throw new ValidationError({
                message: 'Update connection failed due reason: empty properties',
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        return await this._connectionDataAccess.updateConnection(ownerUserId, connectionId, properties, trx);
    }

    public async deleteConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<boolean> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._connectionDataAccess.deleteConnection(ownerUserId, connectionId, trx);
    }

    public async clearGroupFromConnections(ownerUserId: number, userGroupId: number, trx?: IDBTransaction): Promise<number> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(userGroupId)) {
            throw new ValidationError({ message: 'userGroupId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._connectionDataAccess.clearGroupFromConnections(ownerUserId, userGroupId, trx);
    }

    public async createInvitation(userGroupId: number, invitedEmail: string, trx?: IDBTransaction): Promise<IGroupInvitation> {
        if (Utils.isNull(userGroupId)) {
            throw new ValidationError({ message: 'userGroupId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isEmpty(invitedEmail)) {
            throw new ValidationError({ message: 'invitedEmail cant be empty', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._connectionDataAccess.createInvitation(userGroupId, invitedEmail, trx);
    }

    public async deleteInvitationsForGroup(userGroupId: number, trx?: IDBTransaction): Promise<number> {
        if (Utils.isNull(userGroupId)) {
            throw new ValidationError({ message: 'userGroupId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._connectionDataAccess.deleteInvitationsForGroup(userGroupId, trx);
    }
}
