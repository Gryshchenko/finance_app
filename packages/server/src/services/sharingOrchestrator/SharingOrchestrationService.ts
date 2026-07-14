import { ErrorCode, HttpCode, Utils } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IConnectionService } from 'services/connection/ConnectionService';
import { IGroupService } from 'services/group/GroupService';
import { IUserService } from 'services/user/UserService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { ConnectionStatus } from 'types/ConnectionStatus';

export class SharingOrchestrationService extends LoggerBase {
    private readonly _connectionService: IConnectionService;
    private readonly _groupService: IGroupService;
    private readonly _userService: IUserService;

    constructor({
        connectionService,
        groupService,
        userService,
    }: {
        connectionService: IConnectionService;
        groupService: IGroupService;
        userService: IUserService;
    }) {
        super();
        this._connectionService = connectionService;
        this._groupService = groupService;
        this._userService = userService;
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
            await this._connectionService.createInvitation(userGroupId, email);
            this._logger.info(`Invitation created for ownerUserId: ${ownerUserId}, userGroupId: ${userGroupId}`);
        } catch (e: unknown) {
            this._logger.warn(
                `Invite for ownerUserId: ${ownerUserId} not created, responding OK anyway. Reason: ${(e as { message: string }).message}`,
            );
        }
    }

    public async acceptRequest(ownerUserId: number, connectionId: number, userGroupId?: number): Promise<void> {
        return await this.withTransaction(async (trx: IDBTransaction) => {
            const connection = await this._connectionService.getConnection(ownerUserId, connectionId, trx);
            if (connection.status !== ConnectionStatus.Pending) {
                throw new ValidationError({
                    message: `Connection ${connectionId} is not pending`,
                    errorCode: ErrorCode.CONNECTION_ERROR,
                });
            }
            if (!Utils.isNull(userGroupId)) {
                await this._groupService.getGroup(ownerUserId, userGroupId as number, trx);
            }
            await this._connectionService.updateConnection(
                ownerUserId,
                connectionId,
                { status: ConnectionStatus.Connected, userGroupId: userGroupId ?? null },
                trx,
            );
        });
    }

    public async declineRequest(ownerUserId: number, connectionId: number): Promise<void> {
        const connection = await this._connectionService.getConnection(ownerUserId, connectionId);
        if (connection.status !== ConnectionStatus.Pending) {
            throw new ValidationError({
                message: `Connection ${connectionId} is not pending`,
                errorCode: ErrorCode.CONNECTION_ERROR,
            });
        }
        await this._connectionService.updateConnection(ownerUserId, connectionId, { status: ConnectionStatus.Declined });
    }

    public async patchMemberGroup(ownerUserId: number, connectionId: number, userGroupId: number | null): Promise<void> {
        return await this.withTransaction(async (trx: IDBTransaction) => {
            const connection = await this._connectionService.getConnection(ownerUserId, connectionId, trx);
            if (connection.status !== ConnectionStatus.Connected) {
                throw new ValidationError({
                    message: `Connection ${connectionId} is not connected`,
                    errorCode: ErrorCode.CONNECTION_ERROR,
                });
            }
            if (!Utils.isNull(userGroupId)) {
                await this._groupService.getGroup(ownerUserId, userGroupId as number, trx);
            }
            await this._connectionService.updateConnection(ownerUserId, connectionId, { userGroupId }, trx);
        });
    }

    public async removeMember(ownerUserId: number, connectionId: number): Promise<boolean> {
        await this._connectionService.getConnection(ownerUserId, connectionId);
        return await this._connectionService.deleteConnection(ownerUserId, connectionId);
    }

    public async deleteGroup(ownerUserId: number, userGroupId: number): Promise<boolean> {
        return await this.withTransaction(async (trx: IDBTransaction) => {
            await this._groupService.getGroup(ownerUserId, userGroupId, trx);
            await this._connectionService.clearGroupFromConnections(ownerUserId, userGroupId, trx);
            await this._connectionService.deleteInvitationsForGroup(userGroupId, trx);
            return await this._groupService.deleteGroup(ownerUserId, userGroupId, trx);
        });
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
