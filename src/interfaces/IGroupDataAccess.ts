import { IGroup } from 'interfaces/IGroup';

export interface IGroupDataAccess {
    createGroup(userId: string, groupName: string): Promise<IGroup>;
}
