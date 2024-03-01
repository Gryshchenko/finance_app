import { IAccountDataAccess } from 'interfaces/IAccountDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

module.exports = class AccountDataService extends LoggerBase implements IAccountDataAccess {
    private readonly _db: IDatabaseConnection;
    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
};
