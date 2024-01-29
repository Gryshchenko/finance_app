import { IUserDataAccess } from 'interfaces/IUserDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { IUser } from 'interfaces/IUser';
import { LoggerBase } from '../../logger/LoggerBase';
import { printSchema } from 'graphql/utilities';

module.exports = class UserDataService extends LoggerBase implements IUserDataAccess {
    private readonly _db: IDatabaseConnection;
    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    public async getUserByEmail(mail: string): Promise<Partial<IUser>> {
        try {
            return await this._db.query<IUser>('SELECT userid, email FROM users WHERE email = $1', [mail]);
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    public async getUser(email: string, password: string): Promise<IUser> {
        try {
            return await this._db.query<IUser>('SELECT * FROM users WHERE email = $1 AND passwordhash = $2', [email, password]);
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    public async createUser(email: string, password: string, salt: string): Promise<IUser> {
        try {
            const data = await this._db.query<IUser>(
                'INSERT INTO users(email, passwordhash, salt) VALUES($1, $2, $3) RETURNING *',
                [email, password, salt],
            );
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    // public async updateUser(id: string) {
    //     try {
    //     } catch (error) {
    //         this._logger.error(error);
    //         throw error;
    //     }
    // }
    // public async deleteUser(id: string): void {
    //     try {
    //     } catch (error) {
    //         this._logger.error(error);
    //         throw error;
    //     }
    // }
};
