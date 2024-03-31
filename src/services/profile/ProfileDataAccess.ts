import { IProfileDataAccess } from 'interfaces/IProfileDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IProfile } from 'interfaces/IProfile';
import { LanguageType } from 'types/LanguageType';

module.exports = class ProfileDataService extends LoggerBase implements IProfileDataAccess {
    private readonly _db: IDatabaseConnection;
    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    async createProfile(userId: number, locale: LanguageType): Promise<IProfile> {
        try {
            this._logger.info('createProfile request');
            const data = await this._db.engine()('profiles').insert({ userId, locale }, ['*']);
            this._logger.info('createProfile response');
            return data[0];
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    async getProfile(userId: number): Promise<IProfile | undefined> {
        try {
            this._logger.info('getProfile request');
            const data = await this._db.engine()<IProfile>('profiles').where({ userId }).select(['*']).first();
            this._logger.info('getProfile response');
            if (data && data[0]) {
                return data[0];
            }
            return undefined;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
};
