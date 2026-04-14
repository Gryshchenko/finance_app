import PasswordForgetDataAccess from 'services/passwordForget/PasswordForgetDataAccess';
import PasswordForgetService from 'services/passwordForget/PasswordForgetService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

export default class PasswordForgetServiceBuilder {
    public static build() {
        return new PasswordForgetService(
            new PasswordForgetDataAccess(DatabaseConnectionBuilder.build()),
            UserServiceBuilder.build(),
        );
    }
}
