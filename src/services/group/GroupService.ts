import { IGroupDataAccess } from 'interfaces/IGroupDataAccess';
import { IGroupService } from 'interfaces/IGroupService';
import { IGroup } from 'interfaces/IGroup';

module.exports = class GroupService implements IGroupService {
    private _accountDataAccess: IGroupDataAccess;
    public constructor(accountDataAccess: IGroupDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }
    public async createGroup(userId: string, groupName: string): Promise<IGroup> {
        return await this._accountDataAccess.createGroup(userId, groupName);
    }
};