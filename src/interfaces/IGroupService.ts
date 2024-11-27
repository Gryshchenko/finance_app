import { IGroup } from 'interfaces/IGroup';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export interface IGroupService {
    createGroup(userId: number, groupName: string, trx?: IDBTransaction): Promise<IGroup>;
}
