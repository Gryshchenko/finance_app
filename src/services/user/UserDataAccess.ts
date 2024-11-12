import { IUserDataAccess } from 'interfaces/IUserDataAccess';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import { IUser } from 'interfaces/IUser';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IUserStatus } from 'interfaces/IUserStatus';
import { IUserServer } from 'interfaces/IUserServer';
import { ICreateUserServer } from 'interfaces/ICreateUserServer';
import { IGetUserAuthenticationData } from 'interfaces/IGetUserAuthenticationData';

export default class UserDataService extends LoggerBase implements IUserDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    private async fetchUserDetails(userId: number): Promise<IUserServer> {
        try {
            this._logger.info(`Fetching details for userId: ${userId}`);
            const user = await this._db
                .engine()<IUser>('users')
                .select(
                    'users.email',
                    'users.userId',
                    'users.createdAt',
                    'users.updatedAt',
                    'users.status',
                    'profiles.locale',
                    'profiles.userName',
                    'profiles.additionalInfo',
                    'profiles.mailConfirmed',
                    'currencies.currencyCode',
                    'currencies.currencyName',
                    'currencies.symbol',
                )
                .innerJoin('profiles', 'users.userId', 'profiles.userId')
                .innerJoin('currencies', 'profiles.currencyId', 'currencies.currencyId')
                .where('users.userId', userId)
                .first();
            this._logger.info(`User details fetched for userId: ${userId}`);
            return user;
        } catch (error: any) {
            this._logger.error(`Error fetching details for userId: ${userId} - ${error?.message}`);
            throw error;
        }
    }

    public async getUserAuthenticationData(email: string): Promise<IGetUserAuthenticationData | undefined> {
        try {
            this._logger.info(`Getting authentication data for email: ${email}`);
            const response = await this._db
                .engine()<{ email: string }>('users')
                .select('userId', 'email', 'salt', 'passwordHash')
                .where({ email })
                .first();
            this._logger.info(`Authentication data retrieved for email: ${email}`);
            return response || undefined;
        } catch (error: any) {
            this._logger.error(`Error retrieving authentication data for email: ${email} - ${error?.message}`);
            throw error;
        }
    }

    public async getUser(userId: number): Promise<IUserServer> {
        try {
            return await this.fetchUserDetails(userId);
        } catch (error: any) {
            this._logger.error(`Error fetching user by ID: ${userId} - ${error?.message}`);
            throw error;
        }
    }

    public async createUser(email: string, passwordHash: string, salt: string, trx?: ITransaction): Promise<ICreateUserServer> {
        try {
            this._logger.info(`Creating user with email: ${email}`);
            const query = trx || this._db.engine();
            const data = await query('users').insert(
                {
                    email,
                    passwordHash,
                    salt,
                    status: IUserStatus.ACTIVE,
                },
                ['userId', 'status', 'email', 'createdAt', 'updatedAt'],
            );
            this._logger.info(`User created successfully with email: ${email}`);
            return data[0];
        } catch (error: any) {
            this._logger.error(`Error creating user with email: ${email} - ${error?.message}`);
            throw error;
        }
    }

    public async getUserEmail(userId: number): Promise<{ email: string } | undefined> {
        try {
            this._logger.info(`Retrieving email for userId: ${userId}`);
            const response = await this._db.engine()<IUser>('users').select('email').where({ userId }).first();
            this._logger.info(`Email retrieved for userId: ${userId}`);
            return response || undefined;
        } catch (error: any) {
            this._logger.error(`Error retrieving email for userId: ${userId} - ${error?.message}`);
            throw error;
        }
    }

    public async updateUserEmail(userId: number, email: string): Promise<IUserServer> {
        try {
            this._logger.info(`Updating email for userId: ${userId}`);
            await this._db
                .engine()('users')
                .where({ userId })
                .update({
                    email,
                    updatedAt: new Date(),
                });
            this._logger.info(`Email updated for userId: ${userId}`);
            return await this.fetchUserDetails(userId);
        } catch (error: any) {
            this._logger.error(`Error updating email for userId: ${userId} - ${error?.message}`);
            throw error;
        }
    }

}
