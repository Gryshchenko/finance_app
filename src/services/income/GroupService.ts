import { IGroupDataAccess } from 'interfaces/IGroupDataAccess';
import { IGroupService } from 'interfaces/IGroupService';

module.exports = class GroupService implements IGroupService {
    private _accountDataAccess: IGroupDataAccess;
    public constructor(accountDataAccess: IGroupDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }
};
