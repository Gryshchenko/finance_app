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
    public async getUserByEmail(email: string): Promise<string | undefined> {
        try {
            this._logger.info('getUserByEmail request');
            const response = await this._db.engine()<{ email: string }>('users').where({ email }).select('email').first();
            this._logger.info('getUserByEmail response');
            return response?.email ? response.email : undefined;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    public async getUser(email: string, passwordHash: string): Promise<IUser | undefined> {
        try {
            this._logger.info('getUser request');
            const user = await this._db
                .engine()<IUser>('users')
                .where({ email, passwordHash })
                .select('email', 'passwordHash', 'salt', 'userId', 'createdAt', 'updatedAt', 'status')
                .first();
            this._logger.info('getUser response');
            return user;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    public async createUser(email: string, passwordHash: string, salt: string): Promise<IUser> {
        try {
            this._logger.info('createUser request');
            const data = await this._db.engine()('users').insert(
                {
                    email,
                    passwordHash,
                    salt,
                    status: IUserStatus.PROFILE_VERIFICATION,
                },
                ['email', 'passwordHash', 'salt', 'userId', 'createdAt', 'status'],
            );
            this._logger.info('createUser response');
            return data[0];
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    public async updateUserEmail(userId: number, email: string): Promise<IUser | undefined> {
        try {
            this._logger.info('createUser request');
            const data = await this._db.engine()('users').where({ userId }).update(
                {
                    email,
                },
                ['email', 'passwordHash', 'salt', 'userId', 'createdAt', 'status'],
            );
            this._logger.info('createUser response');
            return data[0];
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
};
