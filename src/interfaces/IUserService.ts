import { IUser } from 'interfaces/IUser';
import { ICreateUser } from 'interfaces/ICreateUser';
import { IGetUserAuthenticationData } from 'interfaces/IGetUserAuthenticationData';

export interface IUserService {
    getUserAuthenticationData(email: string): Promise<IGetUserAuthenticationData | undefined>;
    getUser(userId: number): Promise<IUser>;
    createUser(email: string, password: string): Promise<ICreateUser>;
    updateUserEmail(userId: number, email: string): Promise<IUser>;
}
