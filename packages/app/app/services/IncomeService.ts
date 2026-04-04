import { IGetStatsProperties, IIncome, IIncomeStats, IStatsResponse } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { ValidationError } from '@/utils/errors/ValidationError';
import { Logger } from '@/utils/logger/Logger';

export class IncomeService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('IncomeService');

    private static _instance: IncomeService;

    public static instance(): IncomeService {
        return IncomeService._instance || (IncomeService._instance = new IncomeService());
    }

    public async doDeleteIncome(incomeId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IIncome | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start deleting income ${incomeId}`);
            const userId = this._authService.userId;
            const response = await this.authDelete(`/user/${userId}/income/${incomeId}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Delete income successfully id: ${incomeId}`);
            } else {
                this._logger.info(`Delete income failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doGetIncome(incomeId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IIncome | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching incomes');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/income/${incomeId}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching income successfully: ${(response.data as IIncome)?.incomeId}`);
            } else {
                this._logger.info(`Fetching income failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doGetIncomeWithStats({ from, to, period }: IGetStatsProperties): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IStatsResponse<IIncomeStats> | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            if (!from || !to || !period) {
                throw new ValidationError({ message: `Invalid params: from: ${from}, to: ${to}, period: ${period}` });
            }
            this._logger.info('Start fetching incomes with stats');
            const userId = this._authService.userId;
            const response = await this.authGet<IStatsResponse<IIncomeStats>>(
                `/user/${userId}/incomes/stats?from=${from}&to=${to}&period=${period}`,
            );
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching incomes with stats successfully: ${(response.data?.items as [])?.length}`);
            } else {
                this._logger.info(`Fetching incomes with statss failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doGetIncomes(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IIncome[] | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching incomes');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/incomes`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching incomes successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Fetching incomes failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doPatchIncome(
        id: number,
        body: { incomeName: string },
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start patch income');
            const userId = this._authService.userId;
            const response = await this.authPatch(`/user/${userId}/income/${id}`, {
                incomeName: String(body.incomeName),
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Patch income successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Patch income failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doCreateIncome(body: { incomeName: string; currencyId: number; iconId: string }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IIncome | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start create income');
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/income`, {
                incomeName: String(body.incomeName),
                currencyId: Number(body.currencyId),
                iconId: String(body.iconId),
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Create income successfully: ${(response?.data as IIncome)?.incomeId}`);
            } else {
                this._logger.info(`Create income failed: ${response.kind}`);
            }
            return response;
        });
    }
}
