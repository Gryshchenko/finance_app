import UserServiceBuilder from 'src/services/user/UserServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import PasswordForgetService from 'services/passwordForget/PasswordForgetService';
import PasswordForgetDataAccess from 'services/passwordForget/PasswordForgetDataAccess';

export default class PasswordForgetServiceBuilder {
    public static build() {
        return new PasswordForgetService(
            new PasswordForgetDataAccess(DatabaseConnectionBuilder.build()),
            UserServiceBuilder.build(),
        );
    }
}
