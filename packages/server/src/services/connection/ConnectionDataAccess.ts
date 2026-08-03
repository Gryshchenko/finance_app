import { ErrorCode, IConnectedMember } from '@tenpercent/shared';

import { IConnection } from 'interfaces/IConnection';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { validateConnectionId } from 'services/connection/connectionValidation';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { ConnectionStatus } from 'types/ConnectionStatus';

export interface IConnectionDataAccess {
    getConnection(connectionId: number, userId: number): Promise<IConnection | undefined>;
    getConnectedMembers(userId: number): Promise<IConnectedMember[]>;
    getConnectedMembersCount(ownerUserId: number, userGroupId: number): Promise<number>;
}

export default class ConnectionDataAccess extends LoggerBase implements IConnectionDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async getConnection(connectionId: number, userId: number): Promise<IConnection | undefined> {
        validateConnectionId(connectionId, 'connectionId');
        try {
            this._logger.info(`Fetching connection ${connectionId}`);
            const query = this._db.engine();
            const data = await query('userconnections')
                .select(
                    'connectionId',
                    'ownerUserId',
                    'memberUserId',
                    'userGroupId',
                    'userconnections.status',
                    'ownP.publicName as ownerPublicName',
                    'memP.publicName as memberPublicName',
                )
                .leftJoin('profiles as ownP', 'ownP.userId', 'ownerUserId')
                .leftJoin('profiles as memP', 'memP.userId', 'memberUserId')
                .where({ connectionId })
                .andWhere(function () {
                    this.where({ ownerUserId: userId }).orWhere({ memberUserId: userId });
                })
                .first();
            return data || undefined;
        } catch (e) {
            this._logger.error(`Failed to fetch connection ${connectionId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Fetching connection failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async getConnectedMembers(userId: number): Promise<IConnectedMember[]> {
        validateConnectionId(userId, 'userId');
        try {
            this._logger.info(`Fetching connected members for userId: ${userId}`);
            const query = this._db.engine();
            const data = await query('userconnections')
                .select({
                    connectionId: 'userconnections.connectionId',
                    publicName: 'profiles.publicName',
                    email: 'users.email',
                    isOwner: query.raw('true'),
                    userGroupId: 'userconnections.userGroupId',
                })
                .innerJoin('users', 'users.userId', 'userconnections.memberUserId')
                .leftJoin('profiles', 'profiles.userId', 'userconnections.memberUserId')
                .where({
                    'userconnections.ownerUserId': userId,
                    'userconnections.status': ConnectionStatus.Connected,
                })
                .unionAll(function () {
                    this.select({
                        connectionId: 'userconnections.connectionId',
                        publicName: 'profiles.publicName',
                        email: 'users.email',
                        isOwner: query.raw('false'),
                        userGroupId: 'userconnections.userGroupId',
                    })
                        .from('userconnections')
                        .innerJoin('users', 'users.userId', 'userconnections.ownerUserId')
                        .leftJoin('profiles', 'profiles.userId', 'userconnections.ownerUserId')
                        .where({
                            'userconnections.memberUserId': userId,
                            'userconnections.status': ConnectionStatus.Connected,
                        });
                })
                .orderBy('connectionId', 'ASC');

            this._logger.info(`Fetched ${data.length} connected members for userId: ${userId}`);
            return data;
        } catch (e) {
            this._logger.error(
                `Failed to fetch connected members for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching connected members failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }

    public async getConnectedMembersCount(ownerUserId: number, userGroupId: number): Promise<number> {
        try {
            this._logger.info(`Fetching connected members count for userGroupId: ${userGroupId}`);
            const query = this._db.engine();
            const data = await query('userconnections').count('* as count').where({
                'userconnections.userGroupId': userGroupId,
                'userconnections.ownerUserId': ownerUserId,
            });

            this._logger.info(`Fetched ${data[0].count} connected members count for userGroupId: ${userGroupId}`);
            return Number(data[0].count ?? 0);
        } catch (e) {
            this._logger.error(
                `Failed to fetch connected members count for userGroupId: ${userGroupId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching connected members count failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
    }
}
