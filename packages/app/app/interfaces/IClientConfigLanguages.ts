import { LanguageType } from 'tenpercent/shared';

export interface IClientConfigLanguage {
    locale: LanguageType;
    label: string;
    currencyCode: string;
    symbol: string;
}
