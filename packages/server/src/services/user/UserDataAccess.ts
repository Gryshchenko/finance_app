import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IUser } from 'interfaces/IUser';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IUserServer } from 'interfaces/IUserServer';
import { ICreateUserServer } from 'interfaces/ICreateUserServer';
import { IGetUserAuthenticationData } from 'interfaces/IGetUserAuthenticationData';
import { DBError } from 'src/utils/errors/DBError';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';
import { getOnlyNotEmptyProperties } from 'src/utils/validation/getOnlyNotEmptyProperties';
import { IEmailConfirmationData } from 'interfaces/IEmailConfirmationData';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { ErrorCode, Time } from 'tenpercent/shared';
import { HttpCode } from 'tenpercent/shared';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { BaseError } from 'src/utils/errors/BaseError';
import { UserStatus } from 'tenpercent/shared';

export interface IUserDataAccess {
    getUserAuthenticationData(email: string, trx?: IDBTransaction): Promise<IGetUserAuthenticationData | undefined>;
    getUserAuthenticationDataById(id: number, trx?: IDBTransaction): Promise<IGetUserAuthenticationData | undefined>;
    get(userId: number, trx?: IDBTransaction): Promise<IUserServer>;
    create(email: string, password: string, salt: string, trx?: IDBTransaction): Promise<ICreateUserServer>;
    patch(userId: number, properties: Partial<{ email: string; status: UserStatus }>, trx?: IDBTransaction): Promise<void>;
    getUserEmail(userId: number, trx?: IDBTransaction): Promise<{ email: string } | undefined>;
    updateUserPassword(userId: number, passwordHash: string, salt: string, trx?: IDBTransaction): Promise<boolean>;
}

export default class UserDataService extends LoggerBase implements IUserDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    public async getUserAuthenticationDataById(
        userId: number,
        trx?: IDBTransaction,
    ): Promise<IGetUserAuthenticationData | undefined> {
        try {
            this._logger.info(`Getting authentication data for userId: ${userId}`);
            const query = trx || this._db.engine();
            const response = await query<{ userId: number }>('users')
                .select('userId', 'email', 'salt', 'passwordHash')
                .where({ userId })
                .first();
            this._logger.info(`Authentication data retrieved for userId: ${userId}`);
            return response || undefined;
        } catch (e) {
            this._logger.error(
                `Error retrieving authentication data for userId: ${userId} - ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Error retrieving authentication data for userId: ${userId} - ${(e as { message: string }).message}`,
            });
        }
    }

    public async getUserAuthenticationData(email: string, trx?: IDBTransaction): Promise<IGetUserAuthenticationData | undefined> {
        try {
            this._logger.info(`Getting authentication data for email: ${email}`);
            const query = trx || this._db.engine();
            const response = await query<{ email: string }>('users')
                .select('userId', 'email', 'salt', 'passwordHash')
                .where({ email })
                .first();
            this._logger.info(`Authentication data retrieved for email: ${email}`);
            return response || undefined;
        } catch (e) {
            this._logger.error(
                `Error retrieving authentication data for email: ${email} - ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Error retrieving authentication data for email: ${email} - ${(e as { message: string }).message}`,
            });
        }
    }

    public async get(userId: number, trx?: IDBTransaction): Promise<IUserServer> {
        try {
            this._logger.info(`Fetching details for userId: ${userId}`);
            const query = trx || this._db.engine();
            const user = await query<IUser>('users')
                .select('users.email', 'users.userId', 'users.createdAt', 'users.updatedAt', 'users.status')
                .where('users.userId', userId)
                .first();
            this._logger.info(`User details fetched for userId: ${userId}`);
            return user;
        } catch (e) {
            this._logger.error(`Error fetching user by ID: ${userId} - ${(e as { message: string }).message}`);
            throw new DBError({ message: `Error fetching user by ID: ${userId} - ${(e as { message: string }).message}` });
        }
    }

    public async create(email: string, passwordHash: string, salt: string, trx?: IDBTransaction): Promise<ICreateUserServer> {
        try {
            this._logger.info(`Creating user with email: ${email}`);
            const query = trx || this._db.engine();
            const data = await query('users').insert(
                {
                    email,
                    passwordHash,
                    salt,
                    status: UserStatus.NO_VERIFIED,
                },
                ['userId', 'status', 'email', 'createdAt', 'updatedAt'],
            );
            this._logger.info(`User created successfully with email: ${email}`);
            return data[0];
        } catch (e) {
            this._logger.error(`Error creating user with email: ${email} - ${(e as { message: string }).message}`);
            throw new DBError({ message: `Error creating user with email: ${email} - ${(e as { message: string }).message}` });
        }
    }

    public async getUserEmail(userId: number, trx?: IDBTransaction): Promise<{ email: string } | undefined> {
        try {
            this._logger.info(`Retrieving email for userId: ${userId}`);
            const query = trx || this._db.engine();
            const response = await query<IUser>('users').select('email').where({ userId }).first();
            this._logger.info(`Email retrieved for userId: ${userId}`);
            return response || undefined;
        } catch (e) {
            this._logger.error(`Error retrieving email for userId: ${userId} - ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error retrieving email for userId: ${userId} - ${(e as { message: string }).message}`,
            });
        }
    }

    public async updateUserEmail(userId: number, email: string, trx?: IDBTransaction): Promise<boolean> {
        try {
            this._logger.info(`Updating email for userId: ${userId}`);
            const query = trx || this._db.engine();
            const updatedCount = await query('users').where({ userId }).update({
                email,
                updatedAt: Time.getISODateNowUTC(),
            });
            if (updatedCount > 0) {
                this._logger.info(`Email updated for userId: ${userId}`);
                return true;
            } else {
                this._logger.info(`Email not updated for userId: ${userId}`);
                return false;
            }
        } catch (e) {
            this._logger.error(`Error updating email for userId: ${userId} - ${(e as { message: string }).message}`);
            throw new DBError({ message: `Error updating email for userId: ${userId} - ${(e as { message: string }).message}` });
        }
    }
    public async updateUserPassword(userId: number, passwordHash: string, salt: string, trx?: IDBTransaction): Promise<boolean> {
        try {
            this._logger.info(`Updating password for userId: ${userId}`);
            const query = trx || this._db.engine();
            const updatedCount = await query('users').where({ userId }).update({
                passwordHash,
                salt,
                updatedAt: Time.getISODateNowUTC(),
            });
            if (updatedCount > 0) {
                this._logger.info(`Password updated for userId: ${userId}`);
                return true;
            } else {
                this._logger.info(`Password not updated for userId: ${userId}`);
                return false;
            }
        } catch (e) {
            this._logger.error(`Error updating password for userId: ${userId} - ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error updating password for userId: ${userId} - ${(e as { message: string }).message}`,
            });
        }
    }

    public async patch(
        userId: number,
        properties: Partial<{ status: UserStatus; email: string }>,
        trx?: IDBTransaction,
    ): Promise<void> {
        const allowedProperties = {
            updatedAt: Time.getISODateNowUTC(),
            status: properties.status,
            email: properties.email,
        };
        this._logger.info(`Patch userId ${userId}`, allowedProperties);

        try {
            const allowedKeys = ['updatedAt', 'status', 'email'];
            validateAllowedProperties(allowedProperties, allowedKeys);
            const properestForUpdate = getOnlyNotEmptyProperties(allowedProperties, allowedKeys);
            const query = trx || this._db.engine();
            const data = await query<IEmailConfirmationData>('users').where({ userId }).update(properestForUpdate);

            if (data) {
                this._logger.info(`Successfully patch user for userId ${userId}`);
            } else {
                throw new ValidationError({
                    message: `No found for userId: ${userId}`,
                    errorCode: ErrorCode.USER_ERROR,
                    statusCode: HttpCode.NOT_FOUND,
                    payload: {
                        field: 'userId',
                        reason: 'not_found',
                    },
                });
            }
        } catch (e) {
            this._logger.error(`Error patch user for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error patch user for userId ${userId}: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }
}
