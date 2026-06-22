import { IProfileClient, IProfilePatchRequest } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class ProfileService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('ProfileService');

    private static _instance: ProfileService;

    public static instance(): ProfileService {
        return ProfileService._instance || (ProfileService._instance = new ProfileService());
    }

    public async doGetProfile(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IProfileClient | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching profile');
            const userId = this._authService.userId;
            const response = await this.authGet<IProfileClient>(`/user/${userId}/profile`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching profile successfully: profileId=${response.data?.profileId}`);
            } else {
                this._logger.info(`Fetching profile failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doPatchProfile(body: Partial<IProfilePatchRequest>): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start patching profile');
            const userId = this._authService.userId;
            const response = await this.authPatch<undefined>(`/user/${userId}/profile`, {
                ...(body.locale !== undefined && { locale: body.locale }),
                ...(body.currencyCode !== undefined && { currencyCode: body.currencyCode }),
                ...(body.publicName !== undefined && { publicName: body.publicName }),
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info('Patching profile successfully');
            } else {
                this._logger.info(`Patching profile failed: ${response.kind}`);
            }
            return response;
        });
    }
}
