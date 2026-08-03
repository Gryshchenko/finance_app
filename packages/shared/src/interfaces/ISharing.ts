import { IGroupSharedItem } from 'interfaces/IGroupSharedItem';

export interface IShareGroup {
    userGroupId: number;
    groupName: string;
    description?: string | null;
    memberCount?: number;
    groupSharedItems: IGroupSharedItem[];
}

export interface IConnectedMember {
    connectionId: number;
    publicName: string;
    userGroupId: number;
    isOwner: boolean;
    email?: string;
}

export interface IPendingConnectionRequest {
    connectionId: number;
    publicName: string;
    email: string;
    createdAt: string;
}
export interface ISentConnectionRequest {
    connectionId: number;
    email: string;
    createdAt: string;
}
