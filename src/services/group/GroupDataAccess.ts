import { IGroupDataAccess } from 'interfaces/IGroupDataAccess';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IGroup } from 'interfaces/IGroup';

export default class GroupDataAccess extends LoggerBase implements IGroupDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async createGroup(userId: number, groupName: string, trx?: ITransaction): Promise<IGroup> {
        try {
            this._logger.info(`Starting account creating for userId: ${userId}`);
            const query = trx || this._db.engine();
            const data = await query('usergroups').insert({ userId, groupName }, ['userGroupId', 'userId', 'groupName']);
            this._logger.info(`Successfully created ${data[0].userGroupId} group for userId: ${userId}`);
            return data[0];
        } catch (error: any) {
            this._logger.error(`Failed to create group for userId: ${userId}. Error: ${error?.message}`);
            throw new Error(`Fetching group failed due to a database error: ${error.message}`);
        }
    }
}
