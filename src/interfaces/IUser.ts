import { IUserStatus } from 'interfaces/IUserStatus';

export interface IUser {
    userId: number;
    email: string;
    salt: string;
    status: IUserStatus;
    createdat: string;
    updatedat: string;
    passwordHash: string;
}
