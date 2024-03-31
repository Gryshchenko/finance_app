import { IUser } from 'interfaces/IUser';

export interface IUserService {
    getUserByEmail(email: string): Promise<string | undefined>;
    getUser(email: string, password: string): Promise<IUser | undefined>;
    createUser(email: string, password: string): Promise<IUser | undefined>;
    updateUserEmail(userId: number, email: string): Promise<IUser | undefined>;
}
