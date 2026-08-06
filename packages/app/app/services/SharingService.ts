import { IConnectedMember, IPendingConnectionRequest, ISentConnectionRequest } from '@tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class SharingService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('SharingService');

    private static _instance: SharingService;

    public static instance(): SharingService {
        return SharingService._instance || (SharingService._instance = new SharingService());
    }

    public async doGetConnections(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IConnectedMember[] | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching connections');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/sharing/connections`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching connections successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Fetching connections failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doGetConnection(connectionId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IConnectedMember | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start fetching connection ${connectionId}`);
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/sharing/connections/${connectionId}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching connection ${connectionId} successfully`);
            } else {
                this._logger.info(`Fetching connection ${connectionId} failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doGetSentRequests(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ISentConnectionRequest[] | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching sent requests');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/sharing/connections/sent`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching sent requests successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Fetching sent requests failed: ${response.kind}`);
            }
            return response;
        });
    }
    public async doGetPendingRequests(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IPendingConnectionRequest[] | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching pending requests');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/sharing/connections/pending`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching pending requests successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Fetching pending requests failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doInviteUser(body: { email: string; userGroupId: number }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start inviting user');
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/sharing/invite`, body);
            this._logger.info(`Invite user finished: ${response.kind}`);
            return response;
        });
    }

    public async doAcceptRequest(
        connectionId: number,
        userGroupId?: number,
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start accepting request ${connectionId}`);
            const userId = this._authService.userId;
            const body = userGroupId != null ? { userGroupId } : {};
            const response = await this.authPost(`/user/${userId}/sharing/connection/${connectionId}/accept`, body);
            this._logger.info(`Accept request finished: ${response.kind}`);
            return response;
        });
    }

    public async doDeclineRequest(connectionId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start declining request ${connectionId}`);
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/sharing/connection/${connectionId}/decline`, {});
            this._logger.info(`Decline request finished: ${response.kind}`);
            return response;
        });
    }

    public async doLeaveConnection(connectionId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start leaving connection ${connectionId}`);
            const userId = this._authService.userId;
            const response = await this.authDelete(`/user/${userId}/sharing/connection/${connectionId}/leave`);
            this._logger.info(`Leave connection finished: ${response.kind}`);
            return response;
        });
    }
    public async doPatchMemberGroup(
        connectionId: number,
        userGroupId: number,
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start patching member ${connectionId}`);
            const userId = this._authService.userId;
            const response = await this.authPatch(`/user/${userId}/sharing/connection/${connectionId}/member`, { userGroupId });
            this._logger.info(`Patch member finished: ${response.kind}`);
            return response;
        });
    }

    public async doPatchOwnerGroup(
        connectionId: number,
        userGroupId: number,
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start patching owner ${connectionId}`);
            const userId = this._authService.userId;
            const response = await this.authPatch(`/user/${userId}/sharing/connection/${connectionId}/owner`, { userGroupId });
            this._logger.info(`Patch owner finished: ${response.kind}`);
            return response;
        });
    }

    public async doDeleteMember(connectionId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start deleting member ${connectionId}`);
            const userId = this._authService.userId;
            const response = await this.authDelete(`/user/${userId}/sharing/connection/${connectionId}`);
            this._logger.info(`Delete member finished: ${response.kind}`);
            return response;
        });
    }
}
