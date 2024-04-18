import { IProfile } from 'interfaces/IProfile';
import { LanguageType } from 'types/LanguageType';
import { IFailure } from './IFailure';
import { ISuccess } from './ISuccess';

export interface IProfileService {
    createProfile(userId: number, locale: LanguageType): Promise<IProfile>;
    getProfile(userId: number): Promise<IProfile | undefined>;
    proceedMailConfirmationCode(
        userId: number,
        newEmail: string,
        code: number,
        originEmail: string,
    ): Promise<ISuccess<unknown> | IFailure>;
}
