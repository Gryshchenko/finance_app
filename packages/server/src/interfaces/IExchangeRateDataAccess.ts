import { IRate } from '../../../shared/src/interfaces/IRate';

export interface IExchangeRateDataAccess {
    post(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean>;
    patch(baseCurrency: string, targetCurrencies: Record<string, number>): Promise<boolean>;
    gets(baseCurrency: string): Promise<IRate[] | undefined>;
    get(baseCurrency: string, targetCurrency: string): Promise<IRate | undefined>;
}
