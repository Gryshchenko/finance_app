import { IGroup } from 'interfaces/IGroup';

export interface IGroupService {
    createGroup(userId: string, groupName: string): Promise<IGroup>;
}
