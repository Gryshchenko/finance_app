import { LanguageType } from 'tenpercent/shared';

export interface ICreateProfile {
    userId: number;
    currencyCode: string;
    locale: LanguageType;
    publicName: string;
}
