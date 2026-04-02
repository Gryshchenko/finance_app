import { ErrorCode } from 'tenpercent/shared';
import { IRate } from 'tenpercent/shared/dist/interfaces/IRate';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class ExchangeService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('ExchangeService');

    private static _instance: ExchangeService;

    public static instance(): ExchangeService {
        return ExchangeService._instance || (ExchangeService._instance = new ExchangeService());
    }

    public async doGetRateForCurrency(
        sourceCurrency: string,
        targetCurrency: string,
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IRate;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info(`Start fetching rate for currency ${sourceCurrency}`);
            const response = await this.authGet(`/exchange-rates?currency=${sourceCurrency}&targetCurrency=${targetCurrency}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching rate successfully`);
            } else {
                this._logger.info(`Fetching currencies failed: ${response.kind}`);
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
