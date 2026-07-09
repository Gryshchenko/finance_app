import { IAvatarConfig } from 'interfaces/IAvatarConfig';
import { LanguageType } from 'types/LanguageType';

export interface IProfilePatchRequest {
    locale: LanguageType;
    currencyCode: string;
    publicName: string;
    avatar: IAvatarConfig;
}
