import { IProfileClient } from 'tenpercent/shared';

import { IProfile } from 'interfaces/IProfile';

export default class ProfileServiceUtils {
    public static convertServerUserToClientUser(profile: Partial<IProfile> | undefined = {}): IProfileClient {
        return {
            profileId: profile.profileId,
            publicName: profile.publicName,
            currencyId: profile.currencyId,
            locale: profile.locale,
            mailConfirmed: profile.mailConfirmed,
        };
    }
}
