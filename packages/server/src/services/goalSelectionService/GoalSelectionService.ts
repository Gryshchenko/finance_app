import { LoggerBase } from 'helper/logger/LoggerBase';
import { IGoalSelectionDataAccess } from 'services/goalSelectionService/GoalSelectionDataAccess';

export interface IGoalSelectionService {
    get(userId: number): Promise<string[]>;
    post(userId: number, payload: string[]): Promise<void>;
}

export default class GoalSelectionService extends LoggerBase implements IGoalSelectionService {
    private readonly _goalSelectionDataAccess: IGoalSelectionDataAccess;

    public constructor(goalSelectionDataAccess: IGoalSelectionDataAccess) {
        super();
        this._goalSelectionDataAccess = goalSelectionDataAccess;
    }

    public async get(userId: number): Promise<string[]> {
        return await this._goalSelectionDataAccess.get(userId);
    }

    public async post(userId: number, payload: string[]): Promise<void> {
        return await this._goalSelectionDataAccess.post(userId, payload);
    }
}
