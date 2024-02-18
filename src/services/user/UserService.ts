import { IUserDataAccess } from 'interfaces/IUserDataAccess';
import { IUser } from 'interfaces/IUser';

const UserServiceUtils = require('./UserServiceUtils');

module.exports = class UserService {
    private _userDataAccess: IUserDataAccess;
    public constructor(userDataAccess: IUserDataAccess) {
        this._userDataAccess = userDataAccess;
    }
    public async getUserByEmail(email: string): Promise<IUser | undefined> {
        return await this._userDataAccess.getUserByEmail(email);
    }
    public async createUser(email: string, password: string, userName: string): Promise<IUser | undefined> {
        const salt = UserServiceUtils.getRandomSalt();
        return await this._userDataAccess.createUser(email, UserServiceUtils.hashPassword(password, salt), salt, userName);
    }
};
