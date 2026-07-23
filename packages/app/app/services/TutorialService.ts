import { ITutorialRequest, ITutorialResponse } from '@tenpercent/shared';

import { GeneralApiProblemKind } from '@/services/api/apiProblem';

import { ApiAbstract } from './api/apiAbstract';

export class TutorialService extends ApiAbstract {
    private static _instance: TutorialService;
    public static instance(): TutorialService {
        if (!TutorialService._instance) TutorialService._instance = new TutorialService();
        return TutorialService._instance;
    }

    public async doGetTutorials() {
        const userId = this._authService.userId;
        return this.authGet<ITutorialResponse | null>(`/user/${userId}/tutorials`);
    }

    public async doPatchTutorials(payload: Partial<ITutorialRequest>) {
        const userId = this._authService.userId;
        return this.authPatch<ITutorialResponse>(`/user/${userId}/tutorials`, payload);
    }
}

export async function fetchTutorials(): Promise<ITutorialResponse | null> {
    const response = await TutorialService.instance().doGetTutorials();
    if (response.kind !== GeneralApiProblemKind.Ok) {
        throw new Error(`Failed to fetch tutorials: ${response.kind}`);
    }
    return (response.data as ITutorialResponse | null) ?? null;
}
