import { IGroup } from 'interfaces/IGroup';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export interface IGroupDataAccess {
    createGroup(userId: number, groupName: string, trx?: IDBTransaction): Promise<IGroup>;
}
