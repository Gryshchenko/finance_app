import { IGroupDataAccess } from 'interfaces/IGroupDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

module.exports = class GroupDataService extends LoggerBase implements IGroupDataAccess {
    private readonly _db: IDatabaseConnection;
    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
};
