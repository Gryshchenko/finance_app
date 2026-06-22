import { LanguageType } from 'types/LanguageType';

export interface IProfileClient {
    profileId: number | undefined;
    publicName: string | undefined;
    currencyCode: string | undefined;
    locale: LanguageType | undefined;
    email: string | undefined;
}
