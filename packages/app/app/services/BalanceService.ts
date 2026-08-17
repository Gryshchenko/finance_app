import { IBalance, StatsScope } from '@tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class BalanceService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('BalanceService');

    private static _instance: BalanceService;

    public static instance(): BalanceService {
        return BalanceService._instance || (BalanceService._instance = new BalanceService());
    }

    public async doGetBalance(scope?: StatsScope): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IBalance | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start fetching balance`);
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/balance/${scope ? `?scope=${scope}` : ''}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching stats successfully`);
            } else {
                this._logger.info(`Fetching balance failed: ${response.kind}`);
            }
            return response;
        });
    }
}
