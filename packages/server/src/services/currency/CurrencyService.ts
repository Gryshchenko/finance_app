import { ICurrency } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { ICurrencyDataAccess } from 'services/currency/CurrencyDataAccess';

export interface ICurrencyService {
    getByName(symbol: string): Promise<ICurrency | undefined>;
    getBySymbol(symbol: string): Promise<ICurrency | undefined>;
    getByCurrencyCode(currencyCode: string): Promise<ICurrency | undefined>;
    gets(): Promise<ICurrency[]>;
}

export default class CurrencyService extends LoggerBase implements ICurrencyService {
    private readonly _currencyDataAccess: ICurrencyDataAccess;

    public constructor(currencyDataAccess: ICurrencyDataAccess) {
        super();
        this._currencyDataAccess = currencyDataAccess;
    }

    public async gets(): Promise<ICurrency[]> {
        return await this._currencyDataAccess.gets();
    }

    public async getByCurrencyCode(currencyCode: string): Promise<ICurrency | undefined> {
        return await this._currencyDataAccess.getByCurrencyCode(currencyCode);
    }
    public async getByName(symbol: string): Promise<ICurrency | undefined> {
        return this._currencyDataAccess.getByName(symbol);
    }
    public async getBySymbol(symbol: string): Promise<ICurrency | undefined> {
        return this._currencyDataAccess.getBySymbol(symbol);
    }
}
