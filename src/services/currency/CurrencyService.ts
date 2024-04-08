import { ICurrencyDataAccess } from 'interfaces/ICurrencyDataAccess';
import { ICurrencyService } from 'interfaces/ICurrencyService';
import { ICurrency } from 'interfaces/ICurrency';

module.exports = class CurrencyService implements ICurrencyService {
    private _currencyDataAccess: ICurrencyDataAccess;
    public constructor(currencyDataAccess: ICurrencyDataAccess) {
        this._currencyDataAccess = currencyDataAccess;
    }
    public async getCurrency(currencyId: number): Promise<ICurrency | undefined> {
        return await this._currencyDataAccess.getCurrency(currencyId);
    }
    public async getCurrencies(): Promise<ICurrency[]> {
        return await this._currencyDataAccess.getCurrencies();
    }
};
