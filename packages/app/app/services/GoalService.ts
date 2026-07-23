import { IGoalSelectionRequest, IGoalSelectionResponse } from '@tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class GoalService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('GoalService');

    private static _instance: GoalService;

    public static instance(): GoalService {
        return GoalService._instance || (GoalService._instance = new GoalService());
    }

    public async doGetGoals(): Promise<GeneralApiProblem<IGoalSelectionResponse>> {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching selected goals');
            const userId = this._authService.userId;
            const response = await this.authGet<IGoalSelectionResponse>(`/user/${userId}/goals`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info('Fetching selected goals succeeded');
            } else {
                this._logger.info(`Fetching selected goals failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doPostGoals(selectedGoals: IGoalSelectionRequest['selectedGoals']): Promise<GeneralApiProblem<unknown>> {
        return this.withErrorHandler(async () => {
            this._logger.info('Start posting selected goals');
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/goals`, { selectedGoals });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info('Posting selected goals succeeded');
            } else {
                this._logger.info(`Posting selected goals failed: ${response.kind}`);
            }
            return response;
        });
    }
}

export async function fetchSelectedGoals(): Promise<string[]> {
    const response = await GoalService.instance().doGetGoals();
    if (response.kind !== GeneralApiProblemKind.Ok) return [];
    return (response.data as IGoalSelectionResponse | undefined)?.selectedGoals ?? [];
}
