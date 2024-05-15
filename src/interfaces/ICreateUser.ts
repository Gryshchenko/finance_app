import { IUserStatus } from 'interfaces/IUserStatus';

export interface ICreateUser {
    userId: number;
    email: string;
    status: IUserStatus;
    createdAt: string;
    updatedAt: string;
}
