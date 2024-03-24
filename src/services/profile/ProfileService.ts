import { IProfileDataAccess } from 'interfaces/IProfileDataAccess';
import { IProfileService } from 'interfaces/IProfileService';
import { IProfile } from 'interfaces/IProfile';
import { LanguageType } from 'types/LanguageType';

module.exports = class ProfileService implements IProfileService {
    private _profileDataAccess: IProfileDataAccess;
    public constructor(profileDataAccess: IProfileDataAccess) {
        this._profileDataAccess = profileDataAccess;
    }

    async createProfile(userId: number, locale: LanguageType): Promise<IProfile> {
        return await this._profileDataAccess.createProfile(userId, locale);
    }
};
