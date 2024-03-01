import { IGroup } from 'interfaces/IGroup';

export interface IGroupService {
    createGroup(userId: number, groupName: string): Promise<IGroup>;
}
