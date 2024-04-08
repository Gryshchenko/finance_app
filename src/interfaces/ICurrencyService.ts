import { ICurrency } from 'interfaces/ICurrency';

export interface ICurrencyService {
    getCurrency(currencyId: number): Promise<ICurrency | undefined>;
    getCurrencies(): Promise<ICurrency[]>;
}
