import AuthService from './AuthService';
import DatabaseConnection from 'src/repositories/DatabaseConnection';
import UserService from 'src/services/user/UserService';
import UserDataAccess from 'src/services/user/UserDataAccess';
import config from 'src/config/dbConfig';

export default class AuthServiceBuilder {
    public static build() {
        const databaseConnection = new DatabaseConnection(config);
        return new AuthService({
            userService: new UserService(new UserDataAccess(databaseConnection)),
        });
    }
}
