import { KeyValueStoreBuilder } from 'src/repositories/keyValueStore/KeyValueStoreBuilder';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

import AuthService from './AuthService';

export default class AuthServiceBuilder {
    public static build() {
        return new AuthService({
            userService: UserServiceBuilder.build(),
            keyValueStore: KeyValueStoreBuilder.build(),
        });
    }
}
