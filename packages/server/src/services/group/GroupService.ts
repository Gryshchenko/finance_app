import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IGroup } from 'interfaces/IGroup';
import { IGroupDataAccess } from 'services/group/GroupDataAccess';

export interface IGroupService {
    createGroup(userId: number, groupName: string, trx?: IDBTransaction): Promise<IGroup>;
}

export default class GroupService implements IGroupService {
    private readonly _accountDataAccess: IGroupDataAccess;

    public constructor(accountDataAccess: IGroupDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }

    public async createGroup(userId: number, groupName: string, trx?: IDBTransaction): Promise<IGroup> {
        return await this._accountDataAccess.createGroup(userId, groupName, trx);
    }
}
