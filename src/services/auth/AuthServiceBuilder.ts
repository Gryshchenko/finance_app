import AuthService from './AuthService';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

export default class AuthServiceBuilder {
    public static build() {
        return new AuthService({
            userService: UserServiceBuilder.build(),
        });
    }
}
