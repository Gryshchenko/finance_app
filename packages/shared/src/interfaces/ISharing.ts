export interface IShareGroup {
    userGroupId: number;
    groupName: string;
    description?: string | null;
    memberCount?: number;
}

export interface IConnectedMember {
    connectionId: number;
    userId: number;
    publicName: string;
    email: string;
    userGroupId: number | null;
}

export interface IPendingConnectionRequest {
    connectionId: number;
    userId: number;
    publicName: string;
    email: string;
    createdAt: string;
}
