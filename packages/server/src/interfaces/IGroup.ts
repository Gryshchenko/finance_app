import { IGroupSharedItem } from '@tenpercent/shared';

export interface IGroup {
    userGroupId: number;
    userId: number;
    groupName: string;
    description?: string | null;
    groupSharedItems: IGroupSharedItem[];
}

export interface IGroupListItem extends IGroup {
    memberCount: number;
}

export interface ICreateGroup {
    groupName: string;
    description?: string;
    groupSharedItems?: IGroupSharedItem[];
}
