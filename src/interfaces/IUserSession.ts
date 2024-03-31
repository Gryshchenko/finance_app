import { RoleType } from 'types/RoleType';

export interface IUserSession {
    userId: number;
    sessionId: string;
    premission: RoleType;
    createdate: string;
    updatedate: string;
    ip: string | undefined;
    token: string;
    email: string;
}
