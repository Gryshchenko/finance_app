import { IGroup } from 'interfaces/IGroup';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface IGroupService {
    createGroup(userId: number, groupName: string, trx?: ITransaction): Promise<IGroup>;
}
