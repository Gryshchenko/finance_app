import { IGroup } from 'interfaces/IGroup';

export interface IGroupDataAccess {
    createGroup(userId: number, groupName: string): Promise<IGroup>;
}
