import { LanguageType } from 'types/LanguageType';

export interface IProfileClient {
    profileId: number | undefined;
    publicName: string | undefined;
    currencyId: number | undefined;
    locale: LanguageType | undefined;
    mailConfirmed: boolean | undefined;
    email: string | undefined;
}
