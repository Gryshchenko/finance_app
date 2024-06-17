import { LanguageType } from 'types/LanguageType';

export interface IProfileClient {
    userName: string | undefined;
    currencyId: number | undefined;
    locale: LanguageType | undefined;
    mailConfirmed: boolean | undefined;
    additionInfo: Record<string, unknown> | undefined;
    currencyCode: string | undefined;
    currencyName: string | undefined;
    symbol: string | undefined;
}
