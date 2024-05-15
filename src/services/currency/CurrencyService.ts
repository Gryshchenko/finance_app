import { ICurrencyDataAccess } from 'interfaces/ICurrencyDataAccess';
import { ICurrencyService } from 'interfaces/ICurrencyService';
import { ICurrency } from 'interfaces/ICurrency';

export default class CurrencyService implements ICurrencyService {
    private _currencyDataAccess: ICurrencyDataAccess;

    public constructor(currencyDataAccess: ICurrencyDataAccess) {
        this._currencyDataAccess = currencyDataAccess;
    }

    public async getCurrencyByCurrencyCode(currencyCode: string): Promise<ICurrency | undefined> {
        return await this._currencyDataAccess.getCurrencyByCurrencyCode(currencyCode);
    }

    public async getCurrencyById(currencyId: number): Promise<ICurrency | undefined> {
        return await this._currencyDataAccess.getCurrencyById(currencyId);
    }

    public async getCurrencies(): Promise<ICurrency[]> {
        return await this._currencyDataAccess.getCurrencies();
    }
}
