import { IProfile } from 'interfaces/IProfile';
import { IProfileClient } from 'interfaces/IProfileClient';

export default class ProfileServiceUtils {
    public static convertServerUserToClientUser(profile: Partial<IProfile> | undefined = {}): IProfileClient {
        return {
            userName: profile.userName,
            currencyId: profile.currencyId,
            locale: profile.locale,
            mailConfirmed: profile.mailConfirmed,
            additionInfo: profile.additionInfo,
            currencyCode: profile.currencyCode,
            currencyName: profile.currencyName,
            symbol: profile.symbol,
        };
    }
}
