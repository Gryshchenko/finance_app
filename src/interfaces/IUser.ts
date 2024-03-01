import { IUserStatus } from 'interfaces/IUserStatus';

export interface IUser {
    userId: number;
    email: string;
    salt: string;
    status: IUserStatus;
    userName: string;
    createdat: string;
    updatedat: string;
    passwordHash: string;
}
