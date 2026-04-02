import { IRate } from '../../../shared/src/interfaces/IRate';

export interface IExchangeRateService {
    updateCurrencyRates(): Promise<void>;
    get(baseCurrency: string, targetCurrency: string): Promise<IRate | undefined>;
    post(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean>;
    patch(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean>;
    gets(baseCurrency: string): Promise<IRate[] | undefined>;
}
