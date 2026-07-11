import { UserStatus } from '@tenpercent/shared';

export interface ICreateUser {
    userId: number;
    email: string;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}
