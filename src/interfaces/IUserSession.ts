import { IUserStatus } from 'interfaces/IUserStatus';

export interface IUserSession {
    userId: number;
    sessionId: string;
    status: IUserStatus;
    ip: string | undefined;
    token: string;
    email: string;
}
