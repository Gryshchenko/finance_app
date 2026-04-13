import { IUser } from 'interfaces/IUser';
import UserServiceUtils from 'src/services/user/UserServiceUtils';
import { ICreateUser } from 'interfaces/ICreateUser';
import { IGetUserAuthenticationData } from 'interfaces/IGetUserAuthenticationData';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { UserStatus } from 'tenpercent/shared';
import { IUserDataAccess } from 'services/user/UserDataAccess';

export interface IUserService {
    getUserAuthenticationData(email: string, trx?: IDBTransaction): Promise<IGetUserAuthenticationData | undefined>;
    getUserAuthenticationDataById(id: number, trx?: IDBTransaction): Promise<IGetUserAuthenticationData | undefined>;
    getUserIdByMail(email: string, trx?: IDBTransaction): Promise<number | undefined>;
    get(userId: number, trx?: IDBTransaction): Promise<IUser>;
    create(email: string, password: string, trx?: IDBTransaction): Promise<ICreateUser>;
    patch(userId: number, properties: Partial<{ email: string; status: UserStatus }>, trx?: IDBTransaction): Promise<void>;
    updateUserPassword(userId: number, passwordHash: string, salt: string, trx?: IDBTransaction): Promise<boolean>;
}
export default class UserService extends LoggerBase implements IUserService {
    private readonly _userDataAccess: IUserDataAccess;

    public constructor(userDataAccess: IUserDataAccess) {
        super();
        this._userDataAccess = userDataAccess;
    }

    public async getUserAuthenticationDataById(
        userId: number,
        trx?: IDBTransaction,
    ): Promise<IGetUserAuthenticationData | undefined> {
        return await this._userDataAccess.getUserAuthenticationDataById(userId, trx);
    }
    public async getUserAuthenticationData(email: string, trx?: IDBTransaction): Promise<IGetUserAuthenticationData | undefined> {
        return await this._userDataAccess.getUserAuthenticationData(email, trx);
    }
    public async getUserIdByMail(email: string, trx?: IDBTransaction): Promise<number | undefined> {
        return await this._userDataAccess.getUserIdByMail(email, trx);
    }

    public async get(userId: number, trx?: IDBTransaction): Promise<IUser> {
        return UserServiceUtils.formatUserDetails(await this._userDataAccess.get(userId, trx));
    }

    public async create(email: string, password: string, trx?: IDBTransaction): Promise<ICreateUser> {
        const salt = UserServiceUtils.getRandomSalt();
        const hashStr = await UserServiceUtils.hashPassword(password, salt);
        const hash = hashStr as unknown as string;

        return await this._userDataAccess.create(email, hash, salt.toString('hex'), trx);
    }

    public async updateUserPassword(userId: number, passwordHash: string, salt: string, trx?: IDBTransaction): Promise<boolean> {
        return await this._userDataAccess.updateUserPassword(userId, passwordHash, salt, trx);
    }

    public async patch(
        userId: number,
        properties: Partial<{
            email: string;
            status: UserStatus;
        }>,
        trx?: IDBTransaction,
    ): Promise<void> {
        return await this._userDataAccess.patch(userId, properties, trx);
    }
}
