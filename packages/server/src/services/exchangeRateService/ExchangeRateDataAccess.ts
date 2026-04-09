import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';
import { BaseError } from 'src/utils/errors/BaseError';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { IRate } from '../../../../shared/src/interfaces/IRate';

export interface IExchangeRateDataAccess {
    post(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean>;
    patch(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean>;
    gets(baseCurrency: string): Promise<IRate[] | undefined>;
    get(baseCurrency: string, targetCurrency: string): Promise<IRate | undefined>;
}

export default class ExchangeRateDataAccess extends LoggerBase implements IExchangeRateDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    public async post(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean> {
        try {
            this._logger.info(
                `Inserting list of currencies rates for currency: ${baseCurrency}, rates: ${Object.keys(targetCurrencies).length}`,
            );
            const records = Object.entries(targetCurrencies).map(([targetCurrency, rate]) => ({
                baseCurrency,
                targetCurrency,
                rate,
            }));

            if (records.length === 0) {
                throw new Error('target currencies empty');
            }

            const response = await this._db.engine()('currencyRates').insert(records);
            return response.length === records.length;
        } catch (e) {
            this._logger.error(
                `Insert list of currencies rates for currency: ${baseCurrency} failed due reason: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Insert list of currencies rates for currency: ${baseCurrency} failed due reason: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }

    public async patch(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean> {
        try {
            this._logger.info(
                `Patch list of currencies rates for currency: ${baseCurrency}, rates: ${Object.keys(targetCurrencies).length}`,
            );
            const keys = Object.keys(targetCurrencies);
            if (keys.length === 0) {
                throw new Error('target currencies empty');
            }
            const cases = keys.map(() => 'WHEN ? THEN ?').join(' ');

            const inPlaceholders = keys.map(() => '?').join(', ');

            const bindings: string[] = [];

            for (const key of keys) {
                bindings.push(key, String(targetCurrencies[key]));
            }

            bindings.push(baseCurrency, ...keys);

            const query = `
                    UPDATE currencyRates 
                    SET rate = CASE targetCurrency
                      ${cases}
                    END
                    WHERE baseCurrency = ? AND targetCurrency IN (${inPlaceholders})
              `;

            await this._db.engine().raw(query, bindings);
            return true;
        } catch (e) {
            this._logger.error(
                `Updating list of currencies rates for currency: ${baseCurrency} failed due reason: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Updating list of currencies rates for currency: ${baseCurrency} failed due reason: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }
    public async get(baseCurrency: string, targetCurrency: string): Promise<IRate | undefined> {
        try {
            this._logger.info(`Fetch rate for baseCurrency: ${baseCurrency}, targetCurrency: ${targetCurrency}`);
            const data = await this._db
                .engine()('currencyRates')
                .select<IRate>('baseCurrency', 'targetCurrency', 'rate', 'updatedAt')
                .where({
                    baseCurrency,
                    targetCurrency,
                })
                .first();
            if (data) {
                this._logger.info(`Rate for code ${baseCurrency} fetched successfully - ${JSON.stringify(data)}`);
                return data;
            } else {
                throw new NotFoundError({
                    message: `Currency with code ${baseCurrency} - ${targetCurrency} not found`,
                });
            }
        } catch (e) {
            this._logger.error(`Fetch failed due reason: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Fetch failed due reason: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }
    public async gets(baseCurrency: string): Promise<IRate[] | undefined> {
        try {
            this._logger.info(`Fetch rates for baseCurrency: ${baseCurrency}`);
            const data = await this._db
                .engine()('currencyRates')
                .select<IRate[]>('baseCurrency', 'targetCurrency', 'rate', 'updatedAt')
                .where({
                    baseCurrency,
                });
            if (data) {
                this._logger.info(`Rate for code ${baseCurrency} fetched successfully: ${data.length}`);
                return data;
            } else {
                throw new NotFoundError({
                    message: `Rates with code ${baseCurrency}  not found`,
                });
            }
        } catch (e) {
            this._logger.error(`Fetch failed due reason: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Fetch failed due reason: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }
}
