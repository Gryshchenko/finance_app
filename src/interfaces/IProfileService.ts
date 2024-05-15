import { IProfile } from 'interfaces/IProfile';
import { ICreateProfile } from 'interfaces/ICreateProfile';

export interface IProfileService {
    createProfile(data: ICreateProfile): Promise<IProfile | undefined>;
    getProfile(userId: number): Promise<IProfile | undefined>;
    confirmationUserMail(userId: number): Promise<boolean | undefined>;
}
