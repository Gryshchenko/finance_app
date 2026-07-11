import { DateFormat, ErrorCode, IRate, Time } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IHistoricalRateDataAccess } from 'services/historicalRateService/HistoricalRateDataAccess';
import { ValidationError } from 'src/utils/errors/ValidationError';

export interface IHistoricalRateService {
    get(baseCurrency: string, targetCurrency: string, data: string): Promise<IRate | undefined>;
    post(baseCurrency: string, targetCurrency: string, rate: number, data: string): Promise<boolean>;
    patch(baseCurrency: string, targetCurrency: string, rate: number, data: string): Promise<boolean>;
}

const validateDate = (date: string) => {
    let day: string | null = null;
    try {
        day = Time.formatUTCDate(date, DateFormat.YYYY_MM_DD);
    } catch (e) {
        throw new ValidationError({
            message: (e as { message: string }).message,
            errorCode: ErrorCode.HISTORICAL_CURRENCY_DATE_ERROR,
        });
    }
    return day;
};

export default class HistoricalRateService extends LoggerBase implements IHistoricalRateService {
    private readonly _historicalRateDataAccess: IHistoricalRateDataAccess;

    public constructor(historicalRateDataAccess: IHistoricalRateDataAccess) {
        super();
        this._historicalRateDataAccess = historicalRateDataAccess;
    }

    public async get(baseCurrency: string, targetCurrency: string, date: string): Promise<IRate | undefined> {
        const day: string = validateDate(date);
        return await this._historicalRateDataAccess.get(baseCurrency, targetCurrency, day);
    }
    public async post(baseCurrency: string, targetCurrency: string, rate: number, date: string): Promise<boolean> {
        const day: string = validateDate(date);
        return await this._historicalRateDataAccess.post(baseCurrency, targetCurrency, rate, day);
    }
    public async patch(baseCurrency: string, targetCurrency: string, rate: number, date: string): Promise<boolean> {
        const day: string = validateDate(date);
        return await this._historicalRateDataAccess.patch(baseCurrency, targetCurrency, rate, day);
    }
}
