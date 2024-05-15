import { IProfileDataAccess } from 'interfaces/IProfileDataAccess';
import { IProfileService } from 'interfaces/IProfileService';
import { IProfile } from 'interfaces/IProfile';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ICreateProfile } from 'interfaces/ICreateProfile';

export default class ProfileService extends LoggerBase implements IProfileService {
    private _profileDataAccess: IProfileDataAccess;

    public constructor(profileDataAccess: IProfileDataAccess) {
        super();
        this._profileDataAccess = profileDataAccess;
    }

    public async createProfile(data: ICreateProfile): Promise<IProfile | undefined> {
        return await this._profileDataAccess.createProfile(data);
    }

    public async getProfile(userId: number): Promise<IProfile | undefined> {
        return await this._profileDataAccess.getProfile(userId);
    }

    public async confirmationUserMail(userId: number): Promise<boolean | undefined> {
        return await this._profileDataAccess.confirmationUserMail(userId);
    }
}
