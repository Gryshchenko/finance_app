import { IShareGroup } from '@tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class ShareGroupService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('ShareGroupService');

    private static _instance: ShareGroupService;

    public static instance(): ShareGroupService {
        return ShareGroupService._instance || (ShareGroupService._instance = new ShareGroupService());
    }

    public async doGetGroups(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IShareGroup[] | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching groups');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/groups`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching groups successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Fetching groups failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doGetGroup(userGroupId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IShareGroup | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start fetching group ${userGroupId}`);
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/group/${userGroupId}`);
            this._logger.info(`Fetching group finished: ${response.kind}`);
            return response;
        });
    }

    public async doCreateGroup(body: { groupName: string; description?: string }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IShareGroup | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start creating group');
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/group`, body);
            this._logger.info(`Create group finished: ${response.kind}`);
            return response;
        });
    }

    public async doPatchGroup(
        userGroupId: number,
        body: { groupName?: string; description?: string },
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start patching group ${userGroupId}`);
            const userId = this._authService.userId;
            const response = await this.authPatch(`/user/${userId}/group/${userGroupId}`, body);
            this._logger.info(`Patch group finished: ${response.kind}`);
            return response;
        });
    }

    public async doDeleteGroup(userGroupId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start deleting group ${userGroupId}`);
            const userId = this._authService.userId;
            const response = await this.authDelete(`/user/${userId}/group/${userGroupId}`);
            this._logger.info(`Delete group finished: ${response.kind}`);
            return response;
        });
    }
}
