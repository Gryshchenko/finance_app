import { ICurrency } from 'interfaces/ICurrency';

export interface ICurrencyDataAccess {
    getCurrency(currencyId: number): Promise<ICurrency | undefined>;
    getCurrencies(): Promise<ICurrency[]>;
}
