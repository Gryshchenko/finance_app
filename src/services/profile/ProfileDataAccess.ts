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
};
