import { ErrorCode, Time, HttpCode, UserStatus } from '@tenpercent/shared';

import { ICreateUserServer } from 'interfaces/ICreateUserServer';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IEmailConfirmationData } from 'interfaces/IEmailConfirmationData';
import { IGetUserAuthenticationData } from 'interfaces/IGetUserAuthenticationData';
import { IUser } from 'interfaces/IUser';
import { IUserServer } from 'interfaces/IUserServer';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { BaseError } from 'src/utils/errors/BaseError';
import { DBError } from 'src/utils/errors/DBError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { maskEmail } from 'src/utils/maskPII';
import { getOnlyNotEmptyProperties } from 'src/utils/validation/getOnlyNotEmptyProperties';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

export interface IUserDataAccess {
    getUserAuthenticationData(email: string, trx?: IDBTransaction): Promise<IGetUserAuthenticationData | undefined>;
    getUserAuthenticationDataById(id: number, trx?: IDBTransaction): Promise<IGetUserAuthenticationData | undefined>;
    get(userId: number, trx?: IDBTransaction): Promise<IUserServer>;
    create(email: string, password: string, salt: string, trx?: IDBTransaction): Promise<ICreateUserServer>;
    patch(userId: number, properties: Partial<{ email: string; status: UserStatus }>, trx?: IDBTransaction): Promise<void>;
    getUserEmail(userId: number, trx?: IDBTransaction): Promise<{ email: string } | undefined>;
    updateUserPassword(userId: number, passwordHash: string, salt: string, trx?: IDBTransaction): Promise<boolean>;
    getUserIdByMail(email: string, trx?: IDBTransaction): Promise<number | undefined>;
    setSessionsValidFrom(userId: number, date: string, trx?: IDBTransaction): Promise<void>;
    getSessionsValidFromSec(userId: number): Promise<number | null>;
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
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.USER_ERROR,
                message: `Error retrieving authentication data for userId: ${userId} - ${(e as { message: string }).message}`,
            });
        }
    }

    public async getUserAuthenticationData(email: string, trx?: IDBTransaction): Promise<IGetUserAuthenticationData | undefined> {
        try {
            this._logger.info(`Getting authentication data for email: ${maskEmail(email)}`);
            const query = trx || this._db.engine();
            const response = await query<{ email: string }>('users')
                .select('userId', 'email', 'salt', 'passwordHash')
                .where({ email })
                .first();
            this._logger.info(`Authentication data retrieved for email: ${maskEmail(email)}`);
            return response || undefined;
        } catch (e) {
            this._logger.error(
                `Error retrieving authentication data for email: ${email} - ${(e as { message: string }).message}`,
            );
            throw new DBError({
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.USER_ERROR,
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
            throw new DBError({
                message: `Error fetching user by ID: ${userId} - ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.USER_ERROR,
            });
        }
    }

    public async create(email: string, passwordHash: string, salt: string, trx?: IDBTransaction): Promise<ICreateUserServer> {
        try {
            this._logger.info(`Creating user with email: ${maskEmail(email)}`);
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
            this._logger.info(`User created successfully with email: ${maskEmail(email)}`);
            return data[0];
        } catch (e) {
            this._logger.error(`Error creating user with email: ${maskEmail(email)} - ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error creating user with email: ${maskEmail(email)} - ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.USER_ERROR,
            });
        }
    }

    public async getUserIdByMail(email: string, trx?: IDBTransaction): Promise<number | undefined> {
        try {
            this._logger.info(`Retrieving userId for email: ${maskEmail(email)}`);
            const query = trx || this._db.engine();
            const response = await query<IUser>('users').select('userId').where({ email }).first();
            this._logger.info(`UserId retrieved for email: ${maskEmail(email)}`);
            return response?.userId || undefined;
        } catch (e) {
            this._logger.error(`Error retrieving userId for email: ${maskEmail(email)} - ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error retrieving userId for email: ${maskEmail(email)} - ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.USER_ERROR,
            });
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
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.USER_ERROR,
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
            throw new DBError({
                message: `Error updating email for userId: ${userId} - ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.USER_ERROR,
            });
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
                errorCode: ErrorCode.USER_ERROR,
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
                errorCode: ErrorCode.USER_ERROR,
            });
        }
    }
    public async setSessionsValidFrom(userId: number, date: string, trx?: IDBTransaction): Promise<void> {
        const allowedProperties = {
            sessionsValidFrom: date,
        };
        this._logger.info(`Set session valid from: userId ${userId}`);

        try {
            const allowedKeys = ['sessionsValidFrom'];
            validateAllowedProperties(allowedProperties, allowedKeys);
            const properestForUpdate = getOnlyNotEmptyProperties(allowedProperties, allowedKeys);
            const query = trx || this._db.engine();
            const data = await query('users').where({ userId }).update(properestForUpdate);

            if (data) {
                this._logger.info(`Successfully set session valid from for userId ${userId}`);
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
            this._logger.error(`Error set session valid from for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Err set session valid from for userId ${userId}: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.USER_ERROR,
            });
        }
    }
    public async getSessionsValidFromSec(userId: number): Promise<number | null> {
        this._logger.info(`Get session valid from: userId ${userId}`);
        try {
            const query = this._db.engine();
            const data = await query('users')
                .select(query.raw('EXTRACT(EPOCH FROM "sessionsValidFrom") as "validFromSec"'))
                .where({ userId })
                .first<{ validFromSec: string | null } | undefined>();

            // NULL means sessions were never revoked for this user - every token stays valid.
            if (!data || data.validFromSec === null || data.validFromSec === undefined) {
                return null;
            }

            // `iat` is truncated to whole seconds, so the epoch is floored to match. A token
            // minted in the same second as the revocation survives; that is what lets the
            // revoking request hand back a fresh token.
            return Math.floor(Number(data.validFromSec));
        } catch (e) {
            this._logger.error(`Error set session valid from for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Err set session valid from for userId ${userId}: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.USER_ERROR,
            });
        }
    }
}
