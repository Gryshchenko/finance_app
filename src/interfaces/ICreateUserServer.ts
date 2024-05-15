import { IUserStatus } from 'interfaces/IUserStatus';

export interface ICreateUserServer {
    email: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
    status: IUserStatus;
}
