import { IProfileDataAccess } from 'interfaces/IProfileDataAccess';
import { IProfileService } from 'interfaces/IProfileService';
import { IProfile } from 'interfaces/IProfile';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ICreateProfile } from 'interfaces/ICreateProfile';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export default class ProfileService extends LoggerBase implements IProfileService {
    private _profileDataAccess: IProfileDataAccess;

    public constructor(profileDataAccess: IProfileDataAccess) {
        super();
        this._profileDataAccess = profileDataAccess;
    }

    public async createProfile(data: ICreateProfile, trx?: ITransaction): Promise<IProfile | undefined> {
        return await this._profileDataAccess.createProfile(data, trx);
    }

    public async getProfile(userId: number): Promise<IProfile | undefined> {
        return await this._profileDataAccess.getProfile(userId);
    }

    public async confirmationUserMail(userId: number): Promise<boolean | undefined> {
        return await this._profileDataAccess.confirmationUserMail(userId);
    }
}
