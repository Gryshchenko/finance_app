import { ErrorCode, ITutorialRequest, ITutorialResponse } from '@tenpercent/shared';

import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

export interface ITutorialDataAccess {
    get(userId: number): Promise<ITutorialResponse | undefined>;
    patch(userId: number, payload: ITutorialRequest): Promise<ITutorialResponse | undefined>;
}

export default class TutorialDataAccess extends LoggerBase implements ITutorialDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async get(userId: number): Promise<ITutorialResponse | undefined> {
        this._logger.info('Fetching tutorials');

        try {
            const tutorials = await this._db.engine()<ITutorialResponse>('tutorials').where({ userId }).first();
            this._logger.info('Successfully fetched tutorials');
            return tutorials;
        } catch (e) {
            this._logger.error(`Error fetching tutorials: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error fetching tutorials: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.TUTORIAL_ERROR,
            });
        }
    }

    public async patch(userId: number, payload: ITutorialRequest): Promise<ITutorialResponse | undefined> {
        this._logger.info('Updating tutorials');

        try {
            validateAllowedProperties(payload as Record<string, unknown>, [
                'isOnBoardingTutorialView',
                'isAccountTutorialView',
                'isDashboardTutorialView',
                'isBalanceInsightsTutorialView',
                'isIncomeTutorialView',
                'isSharingTutorialView',
                'isCategoryTutorialView',
                'onBoardingViewedSlidesCount',
            ]);

            const changes = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

            const [tutorials] = await this._db
                .engine()<ITutorialResponse>('tutorials')
                .insert({ ...changes, userId })
                .onConflict('userId')
                .merge(changes)
                .returning('*');
            this._logger.info(`Successfully updated tutorials`);
            return tutorials as ITutorialResponse | undefined;
        } catch (e) {
            this._logger.error(`Error updating tutorials: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error updating tutorials: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.TUTORIAL_ERROR,
            });
        }
    }
}
