import { LanguageType } from 'tenpercent/shared';

export interface IProfile {
    profileId: number;
    userId: number;
    publicName: string;
    currencyId: number;
    locale: LanguageType;
}
