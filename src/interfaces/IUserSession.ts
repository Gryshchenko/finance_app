import { RoleType } from 'types/RoleType';

export interface IUserSession {
    userId: string;
    sessionId: string;
    premission: RoleType;
    createdate: string;
    updatedate: string;
    ip: string | undefined;
    token: string;
}
