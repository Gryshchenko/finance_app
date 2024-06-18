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
            this._logger.info('createGroup request');
            const query = trx || this._db.engine();
            const data = await query('usergroups').insert({ userId, groupName }, ['userGroupId', 'userId', 'groupName']);
            this._logger.info('createGroup response');
            return data[0];
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
}
