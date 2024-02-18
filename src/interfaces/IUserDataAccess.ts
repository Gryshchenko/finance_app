import { IUser } from 'interfaces/IUser';

export interface IUserDataAccess {
    getUserByEmail(email: string): Promise<IUser | undefined>;
    getUser(email: string, password: string): Promise<IUser>;
    createUser(email: string, password: string, salt: string): Promise<IUser>;
    // updateUser(id: string): Promise<IUser>;
    // deleteUser(id: string): Promise<boolean>;
}
