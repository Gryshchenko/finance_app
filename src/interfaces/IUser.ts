import { IUserStatus } from 'interfaces/IUserStatus';
import { RoleType } from 'types/RoleType';

export interface IUser {
    userId: number;
    email: string;
    salt: string;
    status: IUserStatus;
    role: RoleType;
    createdAt: string;
    updatedAt: string;
    passwordHash: string;
}
