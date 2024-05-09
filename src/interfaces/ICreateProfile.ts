import { LanguageType } from 'types/LanguageType';

export interface ICreateProfile {
    userId: number;
    currencyId: number;
    locale: LanguageType;
}
