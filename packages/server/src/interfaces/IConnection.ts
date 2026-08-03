import { ConnectionStatus } from 'types/ConnectionStatus';

export interface IConnection {
    connectionId: number;
    ownerUserId: number;
    memberUserId: number;
    userGroupId: number | null;
    status: ConnectionStatus;
    ownerPublicName?: string;
    memberPublicName?: string;
}
