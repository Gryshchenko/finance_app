import { IProfile } from 'interfaces/IProfile';
import { LanguageType } from 'types/LanguageType';

export interface IProfileService {
    createProfile(userId: number, locale: LanguageType): Promise<IProfile>;
}
