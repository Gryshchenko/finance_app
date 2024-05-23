import { IProfileDataAccess } from 'interfaces/IProfileDataAccess';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IProfile } from 'interfaces/IProfile';
import { ICreateProfile } from 'interfaces/ICreateProfile';

export default class ProfileDataService extends LoggerBase implements IProfileDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    async createProfile(data: ICreateProfile, trx?: ITransaction): Promise<IProfile | undefined> {
        try {
            this._logger.info('createProfile request');
            const { userId, locale, currencyId } = data;
            const query = trx || this._db.engine();
            const response = await query('profiles').insert({ userId, locale, currencyId }, ['*']);
            this._logger.info('createProfile response');
            if (response && response[0]) {
                return response[0];
            }
            return undefined;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }

    async getProfile(userId: number): Promise<IProfile | undefined> {
        try {
            this._logger.info('getProfile request');
            const data = await this._db.engine()<IProfile>('profiles').where({ userId }).select<IProfile>(['*']).first();
            this._logger.info('getProfile response');
            if (data) {
                return data;
            }
            return undefined;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }

    async confirmationUserMail(userId: number): Promise<boolean | undefined> {
        try {
            this._logger.info('confirmationUserMail request');
            const data = await this._db.engine()<IProfile>('profiles').where({ userId }).update({ mailConfirmed: true }, ['*']);
            this._logger.info('confirmationUserMail response');
            if (data) {
                return data[0].mailConfirmed;
            }
            return undefined;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
}
