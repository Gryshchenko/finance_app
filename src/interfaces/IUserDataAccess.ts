import { IUserServer } from 'interfaces/IUserServer';
import { ICreateUserServer } from 'interfaces/ICreateUserServer';
import { IGetUserAuthenticationData } from 'interfaces/IGetUserAuthenticationData';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export interface IUserDataAccess {
    getUserAuthenticationData(email: string): Promise<IGetUserAuthenticationData | undefined>;
    getUser(userId: number): Promise<IUserServer>;
    getUserEmail(userId: number): Promise<{ email: string } | undefined>;
    createUser(email: string, password: string, salt: string, trx?: IDBTransaction): Promise<ICreateUserServer>;
    updateUserEmail(userId: number, email: string): Promise<IUserServer>;
}
