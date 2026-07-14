export interface IGroup {
    userGroupId: number;
    userId: number;
    groupName: string;
    description?: string | null;
}

export interface IGroupListItem extends IGroup {
    memberCount: number;
}

export interface ICreateGroup {
    groupName: string;
    description?: string;
}
