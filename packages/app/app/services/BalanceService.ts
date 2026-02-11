import { ErrorCode, IBalance } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { AuthService } from '@/services/AuthService';
import { Logger } from '@/utils/logger/Logger';

export class BalanceService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('BalanceService');
    private readonly _authService: AuthService;

    private static _instance: BalanceService;

    public static instance(): BalanceService {
        return BalanceService._instance || (BalanceService._instance = new BalanceService(AuthService.instance()));
    }

    constructor(authService: AuthService) {
        super();
        this._authService = authService;
    }

    public async doGetBalance(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IBalance | undefined;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info(`Start fetching balance`);
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/balance/`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching stats successfully`);
            } else {
                this._logger.info(`Fetching balance failed: ${response.kind}`);
            }
            return response;
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
