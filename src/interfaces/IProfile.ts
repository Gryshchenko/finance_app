import { LanguageType } from 'types/LanguageType';

export interface IProfile {
    profileId: number;
    userId: number;
    userName: string;
    currencyId: number;
    locale: LanguageType;
    additionInfo: Record<string, unknown>;
}
