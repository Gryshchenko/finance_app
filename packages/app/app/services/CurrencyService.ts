import { ICurrency } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class CurrencyService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('CurrencyService');

    private static _instance: CurrencyService;

    public static instance(): CurrencyService {
        return CurrencyService._instance || (CurrencyService._instance = new CurrencyService());
    }

    constructor() {
        super();
    }

    public async doGetCurrencies(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ICurrency[];
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info(`Start fetching currencies`);
            const response = await this.authGet(`/currencies/`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching currencies successfully: ${(response.data as ICurrency[])?.length}`);
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
