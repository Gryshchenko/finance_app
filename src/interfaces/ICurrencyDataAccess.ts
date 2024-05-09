import { ICurrency } from 'interfaces/ICurrency';

export interface ICurrencyDataAccess {
    getCurrencyById(currencyId: number): Promise<ICurrency | undefined>;
    getCurrencyByCurrencyCode(currencyCode: string): Promise<ICurrency | undefined>;
    getCurrencies(): Promise<ICurrency[]>;
}
