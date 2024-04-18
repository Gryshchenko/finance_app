import { IUser } from 'interfaces/IUser';
import { IFailure } from './IFailure';
import { ISuccess } from './ISuccess';

export interface IAuthService {
    login(email: string, password: string): Promise<ISuccess<{ user: IUser; token: string }> | IFailure>;
}
