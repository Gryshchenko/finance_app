import { IUser } from 'interfaces/IUser';

export interface IAuthService {
    login(email: string, password: string): Promise<{ user: IUser; token: string }>;
}
