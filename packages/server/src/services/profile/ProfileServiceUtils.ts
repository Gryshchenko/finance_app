import { IProfileWithEmail } from 'interfaces/IProfileWithEmail';

export default class ProfileServiceUtils {
    public static convertServerUserToClientUser(profile: IProfileWithEmail): IProfileWithEmail {
        return {
            profileId: profile.profileId ?? undefined,
            publicName: profile.publicName ?? undefined,
            currencyId: profile.currencyId ?? undefined,
            locale: profile.locale ?? undefined,
            mailConfirmed: profile.mailConfirmed ?? undefined,
            email: profile.email ?? undefined,
            userId: profile.userId ?? undefined,
        };
    }
}
