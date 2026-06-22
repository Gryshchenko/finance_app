import { IProfilePatchRequest, Time, ErrorCode } from 'tenpercent/shared';

import { ICreateProfile } from 'interfaces/ICreateProfile';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IProfile } from 'interfaces/IProfile';
import { IProfileWithEmail } from 'interfaces/IProfileWithEmail';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { getOnlyNotEmptyProperties } from 'src/utils/validation/getOnlyNotEmptyProperties';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

export interface IProfileDataAccess {
    post(data: ICreateProfile, trx?: IDBTransaction): Promise<IProfile | undefined>;
    get(userId: number, trx?: IDBTransaction): Promise<IProfileWithEmail | undefined>;
    patch(userId: number, properties: Partial<IProfilePatchRequest>, trx?: IDBTransaction): Promise<boolean | undefined>;
}

export default class ProfileDataService extends LoggerBase implements IProfileDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    async post(data: ICreateProfile, trx?: IDBTransaction): Promise<IProfile> {
        try {
            this._logger.info('Request to create profile');
            const { userId, locale, currencyCode, publicName } = data;
            const query = trx || this._db.engine();
            const response = await query('profiles').insert({ userId, locale, currencyCode, publicName }, ['*']);

            if (!response?.[0]) {
                throw new Error('Failed to create profile');
            }

            this._logger.info('Profile created successfully');
            return response[0];
        } catch (e) {
            this._logger.error(`Profile creation error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Profile creation error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.PROFILE_ERROR,
            });
        }
    }

    async get(userId: number, trx?: IDBTransaction): Promise<IProfileWithEmail | undefined> {
        try {
            this._logger.info('Request to retrieve profile');
            const query = trx || this._db.engine();
            const data = await query<IProfileWithEmail>('profiles')
                .select<IProfileWithEmail>(
                    'profiles.profileId',
                    'profiles.userId',
                    'profiles.publicName',
                    'profiles.currencyCode',
                    'profiles.additionalInfo',
                    'profiles.locale',
                    'users.email',
                )
                .innerJoin('email_confirmations', 'profiles.userId', 'email_confirmations.userId')
                .innerJoin('users', 'profiles.userId', 'users.userId')
                .where({ 'profiles.userId': userId })
                .first();

            this._logger.info('Profile retrieval successful');
            return data || undefined;
        } catch (e) {
            this._logger.error(`Profile retrieval error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Profile retrieval error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.PROFILE_ERROR,
            });
        }
    }

    async patch(userId: number, properties: Partial<IProfilePatchRequest>, trx?: IDBTransaction): Promise<boolean> {
        try {
            this._logger.info(`Request to patch profile for userId: ${userId}`);

            const allowedKeys = ['locale', 'currencyCode', 'publicName'] as string[];

            validateAllowedProperties(properties, allowedKeys);

            const properestForUpdate = getOnlyNotEmptyProperties(properties, allowedKeys);

            properestForUpdate.updatedAt = Time.getISODateNowUTC();
            const query = trx || this._db.engine();
            await query<IProfile>('profiles').where({ userId }).update(properestForUpdate);

            this._logger.info(`Profile patched successfully for userId: ${userId}`);
            return true;
        } catch (e) {
            this._logger.error(`Profile patch error for userId: ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Profile patch error for userId: ${userId}: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.PROFILE_ERROR,
            });
        }
    }
}
