import { LanguageType } from 'types/LanguageType';

export interface IProfile {
    profileId: number;
    userId: number;
    userName: string;
    currencyId: number;
    locale: LanguageType;
    mailConfirmed: boolean;
    additionInfo: Record<string, unknown>;
    currencyCode: string;
    currencyName: string;
    symbol: string;
}
