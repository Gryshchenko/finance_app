import { IProfile } from 'interfaces/IProfile';
import { LanguageType } from 'types/LanguageType';
import { IFailure } from './IFailure';
import { ISuccess } from './ISuccess';
import { ICreateProfile } from 'interfaces/ICreateProfile';

export interface IProfileService {
    createProfile(data: ICreateProfile): Promise<IProfile | undefined>;
    getProfile(userId: number): Promise<IProfile | undefined>;
    proceedMailConfirmationCode(
        userId: number,
        newEmail: string,
        code: number,
        originEmail: string,
    ): Promise<ISuccess<unknown> | IFailure>;
}
