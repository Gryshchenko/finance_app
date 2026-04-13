import { UserStatus } from 'types/UserStatus';

export interface IUserClient {
    userId: number;
    email: string;
    status: UserStatus;
    token: string;
    tokenLong: string | null;
    [key: string]: unknown;
}
