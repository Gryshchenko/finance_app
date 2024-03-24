import { IUserStatus } from 'interfaces/IUserStatus';

export interface IUser {
    userId: number;
    email: string;
    salt: string;
    status: IUserStatus;
    createdAt: string;
    updatedAt: string;
    passwordHash: string;
}
