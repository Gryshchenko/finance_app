import { IProfileClient } from '@tenpercent/shared';

import { IProfileWithEmail } from 'interfaces/IProfileWithEmail';

export default class ProfileServiceUtils {
    public static convertServerUserToClientUser(profile: IProfileWithEmail): IProfileClient {
        return {
            profileId: profile.profileId ?? undefined,
            publicName: profile.publicName ?? undefined,
            currencyCode: profile.currencyCode ?? undefined,
            locale: profile.locale ?? undefined,
            email: profile.email ?? undefined,
            avatar: profile.additionalInfo?.avatar ?? undefined,
        };
    }
}
