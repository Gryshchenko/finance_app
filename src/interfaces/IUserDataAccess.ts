import { IUser } from 'interfaces/IUser';

export interface IUserDataAccess {
    getUserByEmail(email: string): Promise<string | undefined>;
    getUser(email: string, password: string): Promise<IUser | undefined>;
    createUser(email: string, password: string, salt: string): Promise<IUser>;
    updateUserEmail(userId: number, email: string): Promise<IUser | undefined>;
}
