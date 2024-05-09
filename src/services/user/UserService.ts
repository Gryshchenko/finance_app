import { IUserDataAccess } from 'interfaces/IUserDataAccess';
import { IUser } from 'interfaces/IUser';
import { IUserService } from 'interfaces/IUserService';
import UserServiceUtils from 'src/services/user/UserServiceUtils';

export default class UserService implements IUserService {
    private _userDataAccess: IUserDataAccess;
    public constructor(userDataAccess: IUserDataAccess) {
        this._userDataAccess = userDataAccess;
    }
    public async getUserByEmail(email: string): Promise<string | undefined> {
        return await this._userDataAccess.getUserByEmail(email);
    }
    public async getUser(email: string, password: string): Promise<IUser | undefined> {
        return await this._userDataAccess.getUser(email, password);
    }
    public async createUser(email: string, password: string): Promise<IUser | undefined> {
        const salt = UserServiceUtils.getRandomSalt();
        return await this._userDataAccess.createUser(email, UserServiceUtils.hashPassword(password, salt), salt);
    }
    public async updateUserEmail(userId: number, email: string): Promise<IUser | undefined> {
        return await this._userDataAccess.updateUserEmail(userId, email);
    }
}
