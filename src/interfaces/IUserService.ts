import { IUser } from 'interfaces/IUser';

export interface IUserService {
    getUserByEmail(email: string): Promise<IUser | undefined>;
    createUser(email: string, password: string): Promise<IUser | undefined>;
}
