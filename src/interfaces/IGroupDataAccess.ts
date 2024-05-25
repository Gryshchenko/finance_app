import { IGroup } from 'interfaces/IGroup';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface IGroupDataAccess {
    createGroup(userId: number, groupName: string, trx?: ITransaction): Promise<IGroup>;
}
