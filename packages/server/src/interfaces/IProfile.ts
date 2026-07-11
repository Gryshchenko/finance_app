import { IAvatarConfig, LanguageType } from '@tenpercent/shared';

export interface IProfileAdditionalInfo {
    avatar?: IAvatarConfig;
}

export interface IProfile {
    profileId: number;
    userId: number;
    publicName: string;
    currencyCode: string;
    locale: LanguageType;
    additionalInfo?: IProfileAdditionalInfo;
}
