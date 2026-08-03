import { ErrorCode, HttpCode, IGroupSharedItem, Utils } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IConnectionMemberService } from 'services/connection/ConnectionMemberService';
import { IConnectionOwnerService } from 'services/connection/ConnectionOwnerService';
import { IConnectionService } from 'services/connection/ConnectionService';
import { GroupOrchestrationService } from 'services/groupOrchestrator/GroupOrchestrationService';
import { IUserService } from 'services/user/UserService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { CustomError } from 'src/utils/errors/CustomError';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { ConnectionStatus } from 'types/ConnectionStatus';

export class SharingOrchestrationService extends LoggerBase {
    private readonly _connectionService: IConnectionService;
    private readonly _connectionOwnerService: IConnectionOwnerService;
    private readonly _connectionMemberService: IConnectionMemberService;
    private readonly _groupService: GroupOrchestrationService;
    private readonly _userService: IUserService;

    constructor({
        connectionOwnerService,
        connectionMemberService,
        groupService,
        userService,
        connectionService,
    }: {
        connectionOwnerService: IConnectionOwnerService;
        connectionMemberService: IConnectionMemberService;
        groupService: GroupOrchestrationService;
        userService: IUserService;
        connectionService: IConnectionService;
    }) {
        super();
        this._connectionOwnerService = connectionOwnerService;
        this._connectionMemberService = connectionMemberService;
        this._groupService = groupService;
        this._userService = userService;
        this._connectionService = connectionService;
    }

    public async inviteUser(ownerUserId: number, email: string, userGroupId: number): Promise<void> {
        if (Utils.isEmpty(email)) {
            throw new ValidationError({ message: 'email cant be empty', errorCode: ErrorCode.EMAIL_INVALID_ERROR });
        }
        await this._groupService.getGroup(ownerUserId, userGroupId);
        try {
            const invitedUserId = await this._userService.getUserIdByMail(email);
            if (Utils.isNull(invitedUserId)) {
                this._logger.warn(`Invite skipped: no user found for invited email, ownerUserId: ${ownerUserId}`);
                return;
            }
            if (invitedUserId === ownerUserId) {
                this._logger.warn(`Invite skipped: ownerUserId ${ownerUserId} tried to invite own email`);
                return;
            }
            await this._connectionOwnerService.inviteMember(ownerUserId, invitedUserId as number, userGroupId);
            this._logger.info(`Invite created for ownerUserId: ${ownerUserId}, userGroupId: ${userGroupId}`);
        } catch (e: unknown) {
            this._logger.warn(
                `Invite for ownerUserId: ${ownerUserId} not created, responding OK anyway. Reason: ${(e as { message: string }).message}`,
            );
        }
    }

    public async getConnection(
        userId: number,
        connectionId: number,
    ): Promise<{
        connectionId: number;
        userGroupId: number | null;
        status: ConnectionStatus;
        isOwner: boolean;
        publicName: string;
        groupSharedItems?: IGroupSharedItem[];
    }> {
        if (Utils.isNull(userId)) {
            throw new ValidationError({ message: 'userId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        if (Utils.isNull(connectionId)) {
            throw new ValidationError({ message: 'connectionId cant be null', errorCode: ErrorCode.CONNECTION_ERROR });
        }
        const connection = await this._connectionService.getConnection(connectionId, userId);

        if (Utils.isNull(connection)) {
            throw new NotFoundError({
                message: `Connection ${connectionId} not found for userId: ${userId}`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        if (connection.ownerUserId === userId) {
            return {
                connectionId: connection.connectionId,
                userGroupId: connection.userGroupId,
                status: connection.status,
                isOwner: true,
                publicName: connection.memberPublicName ?? 'Unknown',
            };
        }
        if (connection.memberUserId === userId) {
            return {
                connectionId: connection.connectionId,
                userGroupId: connection.userGroupId,
                status: connection.status,
                isOwner: false,
                publicName: connection.ownerPublicName ?? 'Unknow',
            };
        }
        throw new ValidationError({
            message: `Connection not found for userId: ${userId}`,
            errorCode: ErrorCode.CONNECTION_ERROR,
        });
    }

    public async acceptRequest(memberUserId: number, connectionId: number): Promise<void> {
        return await this.withTransaction(async (trx: IDBTransaction) => {
            const connection = await this._connectionMemberService.getConnection(memberUserId, connectionId, trx);
            if (connection.status !== ConnectionStatus.Pending) {
                throw new ValidationError({
                    message: `Connection ${connectionId} is not pending`,
                    errorCode: ErrorCode.CONNECTION_ERROR,
                });
            }
            await this._connectionMemberService.updateStatus(memberUserId, connectionId, ConnectionStatus.Connected, trx);
        });
    }

    public async declineRequest(memberUserId: number, connectionId: number): Promise<void> {
        const connection = await this._connectionMemberService.getConnection(memberUserId, connectionId);
        if (connection.status !== ConnectionStatus.Pending) {
            throw new ValidationError({
                message: `Connection ${connectionId} is not pending`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        await this._connectionMemberService.updateStatus(memberUserId, connectionId, ConnectionStatus.Declined);
    }

    public async patchOwnerGroup(ownerUserId: number, connectionId: number, userGroupId: number | null): Promise<void> {
        return await this.withTransaction(async (trx: IDBTransaction) => {
            const connection = await this._connectionOwnerService.getConnection(ownerUserId, connectionId, trx);
            if (connection.status !== ConnectionStatus.Connected) {
                throw new ValidationError({
                    message: `Connection ${connectionId} is not connected`,
                    errorCode: ErrorCode.CONNECTION_ERROR,
                });
            }
            if (!Utils.isNull(userGroupId)) {
                await this._groupService.getGroup(ownerUserId, userGroupId as number, trx);
            }
            await this._connectionOwnerService.updateGroup(ownerUserId, connectionId, userGroupId, trx);
        });
    }

    public async removeMember(ownerUserId: number, connectionId: number): Promise<boolean> {
        await this._connectionOwnerService.getConnection(ownerUserId, connectionId);
        return await this._connectionOwnerService.deleteConnection(ownerUserId, connectionId);
    }

    public async leaveConnection(memberUserId: number, connectionId: number): Promise<boolean> {
        await this._connectionMemberService.getConnection(memberUserId, connectionId);
        return await this._connectionMemberService.leaveConnection(memberUserId, connectionId);
    }

    private async withTransaction<T>(processor: (trx: IDBTransaction) => Promise<T>): Promise<T> {
        const db: IDatabaseConnection = DatabaseConnectionBuilder.build();
        const uow = new UnitOfWork(db);
        try {
            await uow.start();
            const trx = uow.getTransaction();
            if (Utils.isNull(trx)) {
                throw new CustomError({
                    message: 'Transaction not initiated',
                    errorCode: ErrorCode.CONNECTION_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }
            const response = await processor(trx as unknown as IDBTransaction);
            await uow.commit();
            return response;
        } catch (e: unknown) {
            await uow.rollback();
            throw e;
        }
    }
}
