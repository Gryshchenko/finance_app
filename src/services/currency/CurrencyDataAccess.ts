import { ICurrencyDataAccess } from 'interfaces/ICurrencyDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ICurrency } from 'interfaces/ICurrency';

export default class CurrencyDataAccess extends LoggerBase implements ICurrencyDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async getCurrencies(): Promise<ICurrency[]> {
        try {
            this._logger.info('getCurrencies request');
            const data = await this._db.engine()<ICurrency>('currencies').select<ICurrency[]>(['*']);
            this._logger.info('getCurrencies response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }

    public async getCurrencyById(currencyId: number): Promise<ICurrency | undefined> {
        try {
            this._logger.info('getCurrencyById request');
            const data = await this._db
                .engine()<ICurrency>('currencies')
                .where({ currencyId })
                .select<ICurrency>(['currencyId', 'currencyCode', 'currencyCode', 'currencyName'])
                .first();
            this._logger.info('getCurrencyById response');
            if (data) {
                return data;
            }
            return undefined;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }

    public async getCurrencyByCurrencyCode(currencyCode: string): Promise<ICurrency | undefined> {
        try {
            this._logger.info('getCurrencyByCurrencyCode request');
            const data = await this._db
                .engine()<ICurrency>('currencies')
                .where({ currencyCode })
                .select<ICurrency>(['currencyId', 'currencyCode', 'currencyCode', 'currencyName'])
                .first();
            this._logger.info('getCurrencyByCurrencyCode response');
            if (data) {
                return data;
            }
            return undefined;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
}
