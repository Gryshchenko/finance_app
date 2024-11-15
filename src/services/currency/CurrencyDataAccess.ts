import { ICurrencyDataAccess } from 'interfaces/ICurrencyDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ICurrency } from 'interfaces/ICurrency';
import { DBError } from 'src/utils/errors/DBError';

export default class CurrencyDataAccess extends LoggerBase implements ICurrencyDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async getCurrencies(): Promise<ICurrency[]> {
        this._logger.info('Fetching list of currencies');

        try {
            const data = await this._db.engine()<ICurrency>('currencies').select<ICurrency[]>(['*']);
            this._logger.info(`Successfully fetched list ${data.length} of currencies`);
            return data;
        } catch (e) {
            this._logger.error(`Error fetching currencies: ${(e as { message: string }).message}`);
            throw new DBError({ message: `Error fetching currencies: ${(e as { message: string }).message}` });
        }
    }

    public async getCurrencyById(currencyId: number): Promise<ICurrency | undefined> {
        this._logger.info(`Fetching currency with ID: ${currencyId}`);

        try {
            const data = await this._db
                .engine()<ICurrency>('currencies')
                .where({ currencyId })
                .select<ICurrency>(['currencyId', 'currencyCode', 'currencyName'])
                .first();

            if (data) {
                this._logger.info(`Currency with ID ${currencyId} fetched successfully`);
                return data;
            } else {
                this._logger.warn(`Currency with ID ${currencyId} not found`);
                return undefined;
            }
        } catch (e) {
            this._logger.error(`Error fetching currency with ID ${currencyId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error fetching currency with ID ${currencyId}: ${(e as { message: string }).message}`,
            });
        }
    }

    public async getCurrencyByCurrencyCode(currencyCode: string): Promise<ICurrency | undefined> {
        this._logger.info(`Fetching currency with code: ${currencyCode}`);

        try {
            const data = await this._db
                .engine()<ICurrency>('currencies')
                .where({ currencyCode })
                .select<ICurrency>(['currencyId', 'currencyCode', 'currencyName'])
                .first();

            if (data) {
                this._logger.info(`Currency with code ${currencyCode} fetched successfully`);
                return data;
            } else {
                this._logger.warn(`Currency with code ${currencyCode} not found`);
                return undefined;
            }
        } catch (e) {
            this._logger.error(`Error fetching currency with code ${currencyCode}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error fetching currency with code ${currencyCode}: ${(e as { message: string }).message}`,
            });
        }
    }
}
