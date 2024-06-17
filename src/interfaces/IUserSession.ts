import { IUserStatus } from 'interfaces/IUserStatus';
import { IUserAgentInfo } from 'interfaces/IUserAgentInfo';

export interface IUserSession {
    userId: number;
    sessionId: string;
    status: IUserStatus;
    ip: string | undefined;
    token: string;
    email: string;
    userAgent: IUserAgentInfo | undefined;
}
