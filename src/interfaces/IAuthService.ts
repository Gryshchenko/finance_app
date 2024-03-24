import { IUser } from 'interfaces/IUser';

export interface IAuthService {
    login(email: string, password: string): Promise<ISuccess<{ user: IUser; token: string }> | IFailure>;
}
