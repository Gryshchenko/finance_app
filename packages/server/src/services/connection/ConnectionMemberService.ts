import { ErrorCode, IPendingConnectionRequest, Utils } from '@tenpercent/shared';

import { IConnection } from 'interfaces/IConnection';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IConnectionMemberDataAccess } from 'services/connection/ConnectionMemberDataAccess';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { ConnectionStatus } from 'types/ConnectionStatus';

export interface IConnectionMemberService {
    getConnection(memberUserId: number, connectionId: number, trx?: IDBTransaction): Promise<IConnection>;
    getPendingRequests(memberUserId: number): Promise<IPendingConnectionRequest[]>;
    updateStatus(memberUserId: number, connectionId: number, status: ConnectionStatus, trx?: IDBTransaction): Promise<number>;
    leaveConnection(memberUserId: number, connectionId: number, trx?: IDBTransaction): Promise<boolean>;
}

export default class ConnectionMemberService extends LoggerBase implements IConnectionMemberService {
    private readonly _dataAccess: IConnectionMemberDataAccess;

    public constructor(dataAccess: IConnectionMemberDataAccess) {
        super();
        this._dataAccess = dataAccess;
    }

    public async getConnection(memberUserId: number, connectionId: number, trx?: IDBTransaction): Promise<IConnection> {
        if (Utils.isNull(memberUserId)) {
            throw new ValidationError({ message: 'memberUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        const connection = await this._dataAccess.getConnection(memberUserId, connectionId, trx);
        if (Utils.isNull(connection)) {
            throw new NotFoundError({
                message: `Connection ${connectionId} not found for memberUserId: ${memberUserId}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        return connection as IConnection;
    }

    public async getPendingRequests(memberUserId: number): Promise<IPendingConnectionRequest[]> {
        if (Utils.isNull(memberUserId)) {
            throw new ValidationError({ message: 'memberUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._dataAccess.getPendingRequests(memberUserId);
    }

    public async updateStatus(
        memberUserId: number,
        connectionId: number,
        status: ConnectionStatus,
        trx?: IDBTransaction,
    ): Promise<number> {
        if (Utils.isNull(memberUserId)) {
            throw new ValidationError({ message: 'memberUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (status !== ConnectionStatus.Connected && status !== ConnectionStatus.Declined) {
            throw new ValidationError({
                message: 'status must be Connected or Declined',
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        return await this._dataAccess.updateStatus(memberUserId, connectionId, status, trx);
    }

    public async leaveConnection(memberUserId: number, connectionId: number, trx?: IDBTransaction): Promise<boolean> {
        if (Utils.isNull(memberUserId)) {
            throw new ValidationError({ message: 'memberUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._dataAccess.deleteConnection(memberUserId, connectionId, trx);
    }
}
