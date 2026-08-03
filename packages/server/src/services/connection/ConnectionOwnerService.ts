import { ErrorCode, ISentConnectionRequest, Utils } from '@tenpercent/shared';

import { IConnection } from 'interfaces/IConnection';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IConnectionOwnerDataAccess } from 'services/connection/ConnectionOwnerDataAccess';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { ValidationError } from 'src/utils/errors/ValidationError';

export interface IConnectionOwnerService {
    inviteMember(ownerUserId: number, memberUserId: number, userGroupId: number, trx?: IDBTransaction): Promise<IConnection>;
    getConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<IConnection>;
    updateGroup(ownerUserId: number, connectionId: number, userGroupId: number | null, trx?: IDBTransaction): Promise<number>;
    deleteConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<boolean>;
    getSentRequests(ownerUserId: number): Promise<ISentConnectionRequest[]>;
}

export default class ConnectionOwnerService extends LoggerBase implements IConnectionOwnerService {
    private readonly _dataAccess: IConnectionOwnerDataAccess;

    public constructor(dataAccess: IConnectionOwnerDataAccess) {
        super();
        this._dataAccess = dataAccess;
    }

    public async inviteMember(
        ownerUserId: number,
        memberUserId: number,
        userGroupId: number,
        trx?: IDBTransaction,
    ): Promise<IConnection> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(memberUserId)) {
            throw new ValidationError({ message: 'memberUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(userGroupId)) {
            throw new ValidationError({ message: 'userGroupId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (ownerUserId === memberUserId) {
            throw new ValidationError({
                message: 'ownerUserId and memberUserId cant be the same',
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        return await this._dataAccess.inviteMember(ownerUserId, memberUserId, userGroupId, trx);
    }

    public async getConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<IConnection> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        const connection = await this._dataAccess.getConnection(ownerUserId, connectionId, trx);
        if (Utils.isNull(connection)) {
            throw new NotFoundError({
                message: `Connection ${connectionId} not found for ownerUserId: ${ownerUserId}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        return connection as IConnection;
    }

    public async getSentRequests(ownerUserId: number): Promise<ISentConnectionRequest[]> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._dataAccess.getSentRequests(ownerUserId);
    }

    public async updateGroup(
        ownerUserId: number,
        connectionId: number,
        userGroupId: number | null,
        trx?: IDBTransaction,
    ): Promise<number> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._dataAccess.updateGroup(ownerUserId, connectionId, userGroupId, trx);
    }

    public async deleteConnection(ownerUserId: number, connectionId: number, trx?: IDBTransaction): Promise<boolean> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._dataAccess.deleteConnection(ownerUserId, connectionId, trx);
    }
}
