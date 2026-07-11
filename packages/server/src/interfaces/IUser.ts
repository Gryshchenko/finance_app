import { UserStatus } from '@tenpercent/shared';

export interface IUser {
    userId: number;
    email: string;
    status: UserStatus;
}
