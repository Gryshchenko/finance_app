import { ErrorCode } from '@tenpercent/shared';

import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';

export interface IGoalSelectionDataAccess {
    get(userId: number): Promise<string[]>;
    post(userId: number, payload: string[]): Promise<void>;
}

export default class GoalSelectionDataAccess extends LoggerBase implements IGoalSelectionDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async get(userId: number): Promise<string[]> {
        this._logger.info('Fetching latest goal selection');

        try {
            const row = await this._db
                .engine()<{ userId: number; selectedGoals: string[]; createdAt: Date }>('goals')
                .where({ userId })
                .orderBy('createdAt', 'desc')
                .first();
            this._logger.info('Successfully fetched goal selection');
            return row?.selectedGoals ?? [];
        } catch (e) {
            this._logger.error(`Error fetching goal questions: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error fetching goal questions: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.TUTORIAL_ERROR,
            });
        }
    }

    public async post(userId: number, payload: string[]): Promise<void> {
        this._logger.info('Updating list of goal questions');

        try {
            await this._db.engine()<{ userId: number; selectedGoals: string[] }>('goals').insert({
                userId,
                selectedGoals: payload,
            });
            this._logger.info(`Successfully updated list of goal questions`);
        } catch (e) {
            this._logger.error(`Error updating goal questions: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error updating goal questions: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.TUTORIAL_ERROR,
            });
        }
    }
}
