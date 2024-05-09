import { ICurrency } from 'interfaces/ICurrency';

export interface ICurrencyService {
    getCurrencyById(currencyId: number): Promise<ICurrency | undefined>;
    getCurrencyByCurrencyCode(currencyCode: string): Promise<ICurrency | undefined>;
    getCurrencies(): Promise<ICurrency[]>;
}
