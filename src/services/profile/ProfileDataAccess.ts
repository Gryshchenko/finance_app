import { IProfileDataAccess } from 'interfaces/IProfileDataAccess';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IProfile } from 'interfaces/IProfile';
import { ICreateProfile } from 'interfaces/ICreateProfile';
import { DBError } from 'src/utils/errors/DBError';

export default class ProfileDataService extends LoggerBase implements IProfileDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    async createProfile(data: ICreateProfile, trx?: ITransaction): Promise<IProfile> {
        try {
            this._logger.info('Request to create profile');
            const { userId, locale, currencyId } = data;
            const query = trx || this._db.engine();
            const response = await query('profiles').insert({ userId, locale, currencyId }, ['*']);

            if (!response?.[0]) {
                throw new Error('Failed to create profile');
            }

            this._logger.info('Profile created successfully');
            return response[0];
        } catch (e) {
            this._logger.error(`Profile creation error: ${(e as { message: string }).message}`);
            throw new DBError({ message: `Profile creation error: ${(e as { message: string }).message}` });
        }
    }

    async getProfile(userId: number): Promise<IProfile | undefined> {
        try {
            this._logger.info('Request to retrieve profile');

            const data = await this._db
                .engine()<IProfile>('profiles')
                .select<IProfile>(
                    'profiles.profileId',
                    'profiles.userId',
                    'profiles.userName',
                    'profiles.currencyId',
                    'profiles.additionalInfo',
                    'profiles.locale',
                    'profiles.mailConfirmed',
                    'currencies.currencyCode',
                    'currencies.currencyName',
                    'currencies.symbol',
                )
                .innerJoin('currencies', 'profiles.currencyId', 'currencies.currencyId')
                .where({ userId })
                .first();

            this._logger.info('Profile retrieval successful');
            return data || undefined;
        } catch (e) {
            this._logger.error(`Profile retrieval error: ${(e as { message: string }).message}`);
            throw new DBError({ message: `Profile retrieval error: ${(e as { message: string }).message}` });
        }
    }

    async confirmationUserMail(userId: number): Promise<boolean> {
        try {
            this._logger.info('Request to confirm user email');

            const data = await this._db
                .engine()<IProfile>('profiles')
                .where({ userId })
                .update({ mailConfirmed: true }, ['mailConfirmed']);

            if (!data?.[0]?.mailConfirmed) {
                this._logger.warn('Email confirmation update failed');
                return false;
            }

            this._logger.info('Email confirmed successfully');
            return data[0].mailConfirmed;
        } catch (e) {
            this._logger.error(`Email confirmation error: ${(e as { message: string }).message}`);
            throw new DBError({ message: `Email confirmation error: ${(e as { message: string }).message}` });
        }
    }
}
