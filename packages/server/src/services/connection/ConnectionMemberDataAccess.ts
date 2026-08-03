import { ErrorCode, IPendingConnectionRequest } from '@tenpercent/shared';

import { IConnection } from 'interfaces/IConnection';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { validateConnectionId } from 'services/connection/connectionValidation';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { ConnectionStatus } from 'types/ConnectionStatus';

export interface IConnectionMemberDataAccess {
    getConnection(memberUserId: number, connectionId: number, trx?: IDBTransaction): Promise<IConnection | undefined>;
    getPendingRequests(memberUserId: number): Promise<IPendingConnectionRequest[]>;
    updateStatus(memberUserId: number, connectionId: number, status: ConnectionStatus, trx?: IDBTransaction): Promise<number>;
    deleteConnection(memberUserId: number, connectionId: number, trx?: IDBTransaction): Promise<boolean>;
}

export default class ConnectionMemberDataAccess extends LoggerBase implements IConnectionMemberDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async getConnection(
        memberUserId: number,
        connectionId: number,
        trx?: IDBTransaction,
    ): Promise<IConnection | undefined> {
        validateConnectionId(memberUserId, 'memberUserId');
        validateConnectionId(connectionId, 'connectionId');
        try {
            this._logger.info(`Fetching connection ${connectionId} for memberUserId: ${memberUserId}`);
            const query = trx || this._db.engine();
            const data = await query('userconnections')
                .select('connectionId', 'ownerUserId', 'memberUserId', 'userGroupId', 'status')
                .where({ memberUserId, connectionId })
                .first();
            return data || undefined;
        } catch (e) {
            this._logger.error(
                `Failed to fetch connection ${connectionId} for memberUserId: ${memberUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching connection failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async getPendingRequests(memberUserId: number): Promise<IPendingConnectionRequest[]> {
        validateConnectionId(memberUserId, 'memberUserId');
        try {
            this._logger.info(`Fetching pending connection requests for memberUserId: ${memberUserId}`);
            const query = this._db.engine();
            const data = await query('userconnections')
                .select('userconnections.connectionId', 'profiles.publicName', 'users.email', 'userconnections.createdAt')
                .innerJoin('users', 'users.userId', 'userconnections.ownerUserId')
                .leftJoin('profiles', 'profiles.userId', 'userconnections.ownerUserId')
                .where({
                    'userconnections.memberUserId': memberUserId,
                    'userconnections.status': ConnectionStatus.Pending,
                })
                .orderBy('userconnections.createdAt', 'desc');
            this._logger.info(`Fetched ${data.length} pending requests for memberUserId: ${memberUserId}`);
            return data;
        } catch (e) {
            this._logger.error(
                `Failed to fetch pending requests for memberUserId: ${memberUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching pending requests failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async updateStatus(
        memberUserId: number,
        connectionId: number,
        status: ConnectionStatus,
        trx?: IDBTransaction,
    ): Promise<number> {
        validateConnectionId(memberUserId, 'memberUserId');
        validateConnectionId(connectionId, 'connectionId');
        if (!Object.values(ConnectionStatus).includes(status)) {
            throw new DBError({
                message: 'status must be one of ConnectionStatus values',
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        try {
            this._logger.info(`Updating status of connection ${connectionId} for memberUserId: ${memberUserId}`);
            const query = trx || this._db.engine();
            const updated = await query('userconnections')
                .update({ status, updatedAt: new Date() })
                .where({ memberUserId, connectionId });
            this._logger.info(`Updated connection ${connectionId} for memberUserId: ${memberUserId}, updated rows: ${updated}`);
            return updated;
        } catch (e) {
            this._logger.error(
                `Failed to update connection ${connectionId} for memberUserId: ${memberUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Updating connection failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async deleteConnection(memberUserId: number, connectionId: number, trx?: IDBTransaction): Promise<boolean> {
        validateConnectionId(memberUserId, 'memberUserId');
        validateConnectionId(connectionId, 'connectionId');
        try {
            this._logger.info(`Deleting connection ${connectionId} for memberUserId: ${memberUserId}`);
            const query = trx || this._db.engine();
            const deleted = await query('userconnections').delete().where({ memberUserId, connectionId });
            this._logger.info(`Deleted connection ${connectionId} for memberUserId: ${memberUserId}, deleted rows: ${deleted}`);
            return deleted > 0;
        } catch (e) {
            this._logger.error(
                `Failed to delete connection ${connectionId} for memberUserId: ${memberUserId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Deleting connection failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }
}
