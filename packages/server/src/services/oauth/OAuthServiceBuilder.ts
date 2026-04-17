import UserRegistrationServiceBuilder from 'services/registration/UserRegistrationServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

import OAuthDataAccess from './OAuthDataAccess';
import OAuthService from './OAuthService';
import AppleProvider from './providers/AppleProvider';
import GoogleProvider from './providers/GoogleProvider';
import { IOAuthProvider, OAuthProviderType } from './providers/IOAuthProvider';

export default class OAuthServiceBuilder {
    public static build() {
        const providers = new Map<OAuthProviderType, IOAuthProvider>([
            ['google', new GoogleProvider()],
            ['apple', new AppleProvider()],
        ]);

        return new OAuthService({
            providers,
            oauthDataAccess: new OAuthDataAccess(DatabaseConnectionBuilder.build()),
            userService: UserServiceBuilder.build(),
            registrationService: UserRegistrationServiceBuilder.build(),
        });
    }
}
