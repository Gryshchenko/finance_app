import { ICurrencyDataAccess } from 'interfaces/ICurrencyDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ICurrency } from 'interfaces/ICurrency';

module.exports = class CurrencyDataService extends LoggerBase implements ICurrencyDataAccess {
    private readonly _db: IDatabaseConnection;
    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    public async getCurrencies(): Promise<ICurrency[]> {
        try {
            this._logger.info('getCurrencies request');
            const data = await this._db.engine()<ICurrency>('currencies').select(['*']);
            this._logger.info('getCurrencies response');
            return data[0];
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    public async getCurrency(currencyId: number): Promise<ICurrency | undefined> {
        try {
            this._logger.info('getCurrencies request');
            const data = await this._db
                .engine()<ICurrency>('currencies')
                .where({ currencyId })
                .select(['currencyId', 'currencyCode', 'currencySymbol'])
                .first();
            this._logger.info('getCurrencies response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
};
