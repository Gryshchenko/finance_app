import { ErrorCode } from 'tenpercent/shared';

import { IClientConfig } from '@/interfaces/IClientConfig';
import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class ClientConfigService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('ClientConfigService');

    private static _instance: ClientConfigService;

    public static instance(): ClientConfigService {
        return ClientConfigService._instance || (ClientConfigService._instance = new ClientConfigService());
    }

    public async doGetConfig(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IClientConfig;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info(`Start fetching currencies`);
            return await this.getConfig();
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }
}
