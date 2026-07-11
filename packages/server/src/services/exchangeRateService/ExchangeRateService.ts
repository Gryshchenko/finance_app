import { ICurrency, IRate, Time, TimeDuration } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IRateProvider } from 'interfaces/IRateProvider';
import { IExchangeRateDataAccess } from 'services/exchangeRateService/ExchangeRateDataAccess';
import RateProviderBuilder from 'services/exchangeRateService/providers/RateProviderBuilder';

export interface IExchangeRateService {
    get(baseCurrency: string, targetCurrency: string): Promise<IRate | undefined>;
    post(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean>;
    patch(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean>;
    gets(baseCurrency: string): Promise<IRate[] | undefined>;
    syncCurrenciesRates(currencies: ICurrency[]): Promise<void>;
}

export default class ExchangeRateService extends LoggerBase implements IExchangeRateService {
    private readonly _rateProvider: IRateProvider;
    private readonly _exchangeRateDataAccess: IExchangeRateDataAccess;

    public constructor(exchangeRateDataAccess: IExchangeRateDataAccess) {
        super();
        this._rateProvider = RateProviderBuilder.build();
        this._exchangeRateDataAccess = exchangeRateDataAccess;
    }
    public async get(baseCurrency: string, targetCurrency: string): Promise<IRate | undefined> {
        return await this._exchangeRateDataAccess.get(baseCurrency, targetCurrency);
    }
    public async gets(baseCurrency: string): Promise<IRate[] | undefined> {
        return await this._exchangeRateDataAccess.gets(baseCurrency);
    }
    public async post(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean> {
        return await this._exchangeRateDataAccess.post(baseCurrency, targetCurrencies);
    }
    public async patch(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean> {
        return await this._exchangeRateDataAccess.patch(baseCurrency, targetCurrencies);
    }
    public async getRates(baseCurrency: string, currencies: string[]): Promise<Record<string, number>> {
        return await this._rateProvider.getRates(baseCurrency, currencies);
    }

    private async logAndStoreRates(
        action: 'insert' | 'update',
        currencyCode: string,
        rates: Record<string, number>,
        storeFn: (currencyCode: string, rates: Record<string, number>) => Promise<boolean>,
    ): Promise<void> {
        const result = await storeFn(currencyCode, rates);
        const actionStr = action === 'insert' ? 'inserted' : 'updated';
        const failStr = action === 'insert' ? 'insert' : 'update';

        if (!result) {
            this._logger.error(`Failed to ${failStr} rates for ${currencyCode}, count: ${Object.keys(rates).length}`);
        } else {
            this._logger.info(`Rates for ${currencyCode} successfully ${actionStr}, count: ${Object.keys(rates).length}`);
        }
    }

    public async syncCurrenciesRates(currencies: ICurrency[]): Promise<void> {
        try {
            this._logger.info('Start currency rates update process');

            const currenciesCodes = currencies.map((c) => c.currencyCode);

            for (const { currencyCode } of currencies) {
                try {
                    const currentRates = await this._exchangeRateDataAccess.gets(currencyCode);
                    const currentRatesArray = Array.isArray(currentRates) ? currentRates : [];

                    if (currentRatesArray.length === 0) {
                        this._logger.info(`No existing rates for ${currencyCode}, inserting new full set`);
                        const rates = await this._rateProvider.getRates(currencyCode, currenciesCodes);
                        await this.logAndStoreRates('insert', currencyCode, rates, this._exchangeRateDataAccess.post);
                    } else {
                        const outdatedTargets = currentRatesArray
                            .filter(
                                (rate) =>
                                    Time.getDiff({
                                        to: rate.updatedAt,
                                        duration: TimeDuration.Hour,
                                    }) >= 12,
                            )
                            .map((rate) => rate.targetCurrency);

                        if (outdatedTargets.length > 0) {
                            this._logger.info(`Found ${outdatedTargets.length} outdated rates for ${currencyCode}, updating...`);
                            const rates = await this._rateProvider.getRates(currencyCode, outdatedTargets);
                            await this.logAndStoreRates('update', currencyCode, rates, this._exchangeRateDataAccess.patch);
                        } else {
                            this._logger.info(`All rates for ${currencyCode} are up to date`);
                        }
                    }
                } catch (e) {
                    this._logger.error(`Failed to process rates for ${currencyCode}: ${(e as { message: string }).message}`);
                }
            }
        } catch (e) {
            this._logger.error(`Currency rate update failed: ${(e as { message: string }).message}`);
        }
    }
}
