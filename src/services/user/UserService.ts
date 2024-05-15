import { IUserDataAccess } from 'interfaces/IUserDataAccess';
import { IUser } from 'interfaces/IUser';
import { IUserService } from 'interfaces/IUserService';
import UserServiceUtils from 'src/services/user/UserServiceUtils';
import { ICreateUser } from 'interfaces/ICreateUser';
import { IGetUserAuthenticationData } from 'interfaces/IGetUserAuthenticationData';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

export default class UserService extends LoggerBase implements IUserService {
    private _userDataAccess: IUserDataAccess;

    public constructor(userDataAccess: IUserDataAccess) {
        super();
        this._userDataAccess = userDataAccess;
    }

    public async getUserAuthenticationData(email: string): Promise<IGetUserAuthenticationData | undefined> {
        return await this._userDataAccess.getUserAuthenticationData(email);
    }

    public async getUser(userId: number): Promise<IUser> {
        return UserServiceUtils.formatUserDetails(await this._userDataAccess.getUser(userId));
    }

    public async createUser(email: string, password: string): Promise<ICreateUser> {
        const salt = UserServiceUtils.getRandomSalt();
        return await this._userDataAccess.createUser(email, UserServiceUtils.hashPassword(password, salt), salt);
    }

    public async updateUserEmail(userId: number, email: string): Promise<IUser> {
        const response = await this._userDataAccess.getUserEmail(userId);
        if (response?.email && email !== response.email) {
            return UserServiceUtils.formatUserDetails(await this._userDataAccess.updateUserEmail(userId, email));
        }
        if (!response || !response?.email) {
            this._logger.info('updateUserEmail cant find email');
        }
        return this.getUser(userId);
    }
}
