import { IUserDataAccess } from 'interfaces/IUserDataAccess';
import { IUser } from 'interfaces/IUser';
import { IUserService } from 'interfaces/IUserService';
import UserServiceUtils from 'src/services/user/UserServiceUtils';
import { ICreateUser } from 'interfaces/ICreateUser';
import { IGetUserAuthenticationData } from 'interfaces/IGetUserAuthenticationData';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ITransaction } from 'interfaces/IDatabaseConnection';

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

    public async createUser(email: string, password: string, trx?: ITransaction): Promise<ICreateUser> {
        const salt = UserServiceUtils.getRandomSalt();
        const hashStr = await UserServiceUtils.hashPassword(password, salt);
        const hash = hashStr as unknown as string;

        const user = await this._userDataAccess.createUser(email, hash, salt.toString('hex'), trx);
        return user;
    }

    public async updateUserEmail(userId: number, email: string): Promise<IUser> {
        const response = await this._userDataAccess.getUserEmail(userId);
        if (response?.email && email !== response.email) {
            return UserServiceUtils.formatUserDetails(await this._userDataAccess.updateUserEmail(userId, email));
        }
        return this.getUser(userId);
    }
}
