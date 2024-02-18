import { IUserDataAccess } from 'interfaces/IUserDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { IUser } from 'interfaces/IUser';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IUserStatus } from 'interfaces/IUserStatus';

module.exports = class UserDataService extends LoggerBase implements IUserDataAccess {
    private readonly _db: IDatabaseConnection;
    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    public async getUserByEmail(email: string): Promise<IUser | undefined> {
        try {
            const users = await this._db
                .engine()<IUser>('users')
                .where({ email })
                .select('userId', 'email', 'userName', 'passwordHash')
                .first();
            return users as IUser;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    public async getUser(email: string, passwordHash: string): Promise<IUser> {
        try {
            return (await this._db.engine()<IUser>('users').where({ email, passwordHash }).select('*').first()) as IUser;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    public async createUser(email: string, passwordHash: string, salt: string, userName: string): Promise<IUser> {
        try {
            console.log({
                email,
                passwordHash,
                salt,
                userName,
                status: IUserStatus.MAIL_VERIFICATION,
            });
            const data = await this._db.engine()('users').insert(
                {
                    email,
                    passwordHash,
                    salt,
                    userName,
                    status: IUserStatus.MAIL_VERIFICATION,
                },
                ['email', 'passwordHash', 'salt', 'userId', 'createdAt', 'userName', 'status'],
            );
            return data[0];
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
};
