import { DateFormat, ErrorCode, IRate, Time, Utils } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { ICurrencyService } from 'services/currency/CurrencyService';
import { IExchangeRateService } from 'services/exchangeRateService/ExchangeRateService';
import { IHistoricalRateService } from 'services/historicalRateService/HistoricalRateService';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';

export interface ICurrencyOrchestratorService {
    syncCurrenciesRates(): Promise<void>;
    get(baseCurrency: string, targetCurrency: string, data?: string): Promise<IRate | undefined>;
}

const CURRENCY_CODE_REGEX = /^[A-Za-z]{3}$/;

const validateCurrency = (currency: string, field: string): void => {
    if (Utils.isEmpty(currency) || !CURRENCY_CODE_REGEX.test(currency)) {
        throw new ValidationError({
            message: `Conversation failed, ${field} currency code is invalid: ${currency}`,
            errorCode: ErrorCode.CURRENCY_ERROR,
        });
    }
};

class CurrencyOrchestratorService extends LoggerBase implements ICurrencyOrchestratorService {
    private readonly _exchangeRateService: IExchangeRateService;
    private readonly _currencyService: ICurrencyService;
    private readonly _historicalRateService: IHistoricalRateService;

    constructor({
        exchangeRateService,
        currencyService,
        historicalRateService,
    }: {
        exchangeRateService: IExchangeRateService;
        currencyService: ICurrencyService;
        historicalRateService: IHistoricalRateService;
    }) {
        super();
        this._exchangeRateService = exchangeRateService;
        this._currencyService = currencyService;
        this._historicalRateService = historicalRateService;
    }
    public async syncCurrenciesRates(): Promise<void> {
        const currencies = await this._currencyService.gets();
        await this._exchangeRateService.syncCurrenciesRates(currencies);
    }
    public async get(
        baseCurrency: string,
        targetCurrency: string,
        date: string = Time.formatUTCDate(Time.getISODateNowUTC(), DateFormat.YYYY_MM_DD),
    ): Promise<IRate | undefined> {
        validateCurrency(baseCurrency, 'base');
        validateCurrency(targetCurrency, 'target');
        try {
            const historical = await this._historicalRateService.get(baseCurrency, targetCurrency, date);
            if (Utils.isNotNull(historical) && Utils.greaterThen0(historical.rate)) {
                return historical;
            }
            const rateFresh = await this._exchangeRateService.get(baseCurrency, targetCurrency);
            if (Utils.isNotNull(rateFresh) && Utils.greaterThen0(rateFresh.rate)) {
                await this._historicalRateService.post(baseCurrency, targetCurrency, rateFresh.rate, date);
                return rateFresh;
            }
            throw new Error(`Can't get rate for baseCurrency: ${baseCurrency}, targetCurrency: ${targetCurrency}, date: ${date}`);
        } catch (e: unknown) {
            throw new CustomError({
                errorCode: ErrorCode.CURRENCY_ERROR,
                message: (e as { message: string }).message,
            });
        }
    }
}

export default CurrencyOrchestratorService;
