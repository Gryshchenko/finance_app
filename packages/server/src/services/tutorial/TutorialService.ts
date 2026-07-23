import { ITutorialRequest, ITutorialResponse } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { ITutorialDataAccess } from 'services/tutorial/TutorialDataAccess';

export interface ITutorialService {
    get(userId: number): Promise<ITutorialResponse | undefined>;
    patch(userId: number, payload: ITutorialRequest): Promise<ITutorialResponse | undefined>;
}

export default class TutorialService extends LoggerBase implements ITutorialService {
    private readonly _tutorialDataAccess: ITutorialDataAccess;

    public constructor(tutorialDataAccess: ITutorialDataAccess) {
        super();
        this._tutorialDataAccess = tutorialDataAccess;
    }

    public async get(userId: number): Promise<ITutorialResponse | undefined> {
        return await this._tutorialDataAccess.get(userId);
    }

    public async patch(userId: number, payload: ITutorialRequest): Promise<ITutorialResponse | undefined> {
        return await this._tutorialDataAccess.patch(userId, payload);
    }
}
