import { ISummary, StatsPeriod } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class StatsService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('StatsService');

    private static _instance: StatsService;

    public static instance(): StatsService {
        return StatsService._instance || (StatsService._instance = new StatsService());
    }

    public async doGetStats({ from, to, period }: { from: string; to: string; period: StatsPeriod }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ISummary | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start fetching stats from=${from} to=${to} period=${period}`);
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/stats/summary?from=${from}&to=${to}&period=${period}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching stats successfully`);
            } else {
                this._logger.info(`Fetching stats failed: ${response.kind}`);
            }
            return response;
        });
    }
}
