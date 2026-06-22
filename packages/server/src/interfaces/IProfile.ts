import { LanguageType } from 'tenpercent/shared';

export interface IProfile {
    profileId: number;
    userId: number;
    publicName: string;
    currencyCode: string;
    locale: LanguageType;
}
