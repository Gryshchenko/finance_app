import { IProfile } from 'interfaces/IProfile';
import { LanguageType } from 'types/LanguageType';

export interface IProfileDataAccess {
    createProfile(userId: number, locale: LanguageType): Promise<IProfile>;
    getProfile(userId: number): Promise<IProfile | undefined>;
}
