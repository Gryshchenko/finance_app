import { ErrorCode, IRate, Time } from '@tenpercent/shared';

import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { BaseError } from 'src/utils/errors/BaseError';
import { DBError } from 'src/utils/errors/DBError';
import { isBaseError } from 'src/utils/errors/isBaseError';

export interface IHistoricalRateDataAccess {
    get(baseCurrency: string, targetCurrency: string, data: string): Promise<IRate | undefined>;
    post(baseCurrency: string, targetCurrency: string, rate: number, data: string): Promise<boolean>;
    patch(baseCurrency: string, targetCurrency: string, rate: number, data: string): Promise<boolean>;
}

export default class HistoricalRateDataAccess extends LoggerBase implements IHistoricalRateDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    public async post(baseCurrency: string, targetCurrency: string, rate: number, date: string): Promise<boolean> {
        try {
            this._logger.info(`Post currency rate for currency: ${baseCurrency}, rate: ${targetCurrency}, date: ${date}`);

            const response = await this._db.engine()('historical_currency_rates').insert({
                rate: rate,
                targetCurrency,
                baseCurrency,
                date,
            });
            return response.length > 0;
        } catch (e) {
            this._logger.error(
                `Insert list of currencies rates for currency: ${baseCurrency} failed due reason: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Insert list of currencies rates for currency: ${baseCurrency} failed due reason: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.HISTORICAL_CURRENCY_ERROR,
            });
        }
    }

    public async patch(baseCurrency: string, targetCurrency: string, rate: number, date: string): Promise<boolean> {
        try {
            this._logger.info(
                `Patch currency rate for currency: ${baseCurrency}, targetCurrency: ${targetCurrency}, date: ${date}`,
            );

            await this._db
                .engine()('historical_currency_rates')
                .update({
                    rate,
                })
                .where({
                    baseCurrency,
                    targetCurrency,
                    date,
                    updatedAt: Time.getISODateNowUTC(),
                });
            return true;
        } catch (e) {
            throw new DBError({
                message: `Updating list of currencies rates for currency: ${baseCurrency} failed due reason: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.HISTORICAL_CURRENCY_ERROR,
            });
        }
    }
    public async get(baseCurrency: string, targetCurrency: string, date: string): Promise<IRate | undefined> {
        try {
            this._logger.info(`Fetch rate for baseCurrency: ${baseCurrency}, targetCurrency: ${targetCurrency}`);
            const data = await this._db
                .engine()('historical_currency_rates')
                .select<IRate>('baseCurrency', 'targetCurrency', 'rate', 'updatedAt', 'date')
                .where({
                    baseCurrency,
                    targetCurrency,
                    date,
                })
                .first();
            this._logger.info(`Rate for code ${baseCurrency} fetched successfully - ${JSON.stringify(data)}`);
            return data;
        } catch (e) {
            throw new DBError({
                message: `Fetch failed due reason: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.HISTORICAL_CURRENCY_ERROR,
            });
        }
    }
}
