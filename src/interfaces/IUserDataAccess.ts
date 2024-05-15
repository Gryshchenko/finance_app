import { IUserServer } from 'interfaces/IUserServer';
import { ICreateUserServer } from 'interfaces/ICreateUserServer';
import { IGetUserAuthenticationData } from 'interfaces/IGetUserAuthenticationData';

export interface IUserDataAccess {
    getUserAuthenticationData(email: string): Promise<IGetUserAuthenticationData | undefined>;
    getUser(userId: number): Promise<IUserServer>;
    getUserEmail(userId: number): Promise<{ email: string } | undefined>;
    createUser(email: string, password: string, salt: string): Promise<ICreateUserServer>;
    updateUserEmail(userId: number, email: string): Promise<IUserServer>;
}
