import { PermissionType } from 'src/types/PermissionType';

export interface IUserSession {
    userId: string;
    sessionId: string;
    premission: PermissionType;
    createdate: string;
    updatedate: string;
    ip: string | undefined;
    token: string;
}
