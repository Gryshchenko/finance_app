import { IProfile } from 'interfaces/IProfile';
import { LanguageType } from 'types/LanguageType';
import { ICreateProfile } from 'interfaces/ICreateProfile';

export interface IProfileDataAccess {
    createProfile(data: ICreateProfile): Promise<IProfile | undefined>;
    getProfile(userId: number): Promise<IProfile | undefined>;
}
