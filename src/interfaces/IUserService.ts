import { IUser } from 'interfaces/IUser';
import { ICreateUser } from 'interfaces/ICreateUser';
import { IGetUserAuthenticationData } from 'interfaces/IGetUserAuthenticationData';
import { ITransaction } from 'interfaces/IDatabaseConnection';
import { IFailure } from 'interfaces/IFailure';
import { ISuccess } from 'interfaces/ISuccess';

export interface IUserService {
    getUserAuthenticationData(email: string): Promise<IGetUserAuthenticationData | undefined>;
    getUser(userId: number): Promise<IUser>;
    createUser(email: string, password: string, trx?: ITransaction): Promise<ISuccess<ICreateUser> | IFailure>;
    updateUserEmail(userId: number, email: string): Promise<IUser>;
}
