import { UserStatus } from '@tenpercent/shared';

export interface ICreateUserServer {
    email: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
    status: UserStatus;
}
