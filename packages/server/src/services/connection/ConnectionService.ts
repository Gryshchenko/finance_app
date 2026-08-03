import { ErrorCode, IConnectedMember, Utils } from '@tenpercent/shared';

import { IConnection } from 'interfaces/IConnection';
import { IConnectionDataAccess } from 'services/connection/ConnectionDataAccess';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { ValidationError } from 'src/utils/errors/ValidationError';

export interface IConnectionService {
    getConnection(connectionId: number, userId: number): Promise<IConnection>;
    getConnectedMembers(userId: number): Promise<IConnectedMember[]>;
    getConnectedMembersCount(ownerUserId: number, userGroupId: number): Promise<number>;
}

export default class ConnectionService extends LoggerBase implements IConnectionService {
    private readonly _dataAccess: IConnectionDataAccess;

    public constructor(dataAccess: IConnectionDataAccess) {
        super();
        this._dataAccess = dataAccess;
    }

    public async getConnection(connectionId: number, userId: number): Promise<IConnection> {
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        const connection = await this._dataAccess.getConnection(connectionId, userId);
        if (Utils.isNull(connection)) {
            throw new NotFoundError({
                message: `Connection ${connectionId} not found`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        return connection as IConnection;
    }

    public async getConnectedMembers(userId: number): Promise<IConnectedMember[]> {
        if (Utils.isNull(userId)) {
            throw new ValidationError({ message: 'userId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        return await this._dataAccess.getConnectedMembers(userId);
    }

    public async getConnectedMembersCount(ownerUserId: number, userGroupId: number): Promise<number> {
        if (Utils.isNull(ownerUserId)) {
            throw new ValidationError({ message: 'ownerUserId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(userGroupId)) {
            throw new ValidationError({ message: 'userGroupId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }

        return await this._dataAccess.getConnectedMembersCount(ownerUserId, userGroupId);
    }
}
