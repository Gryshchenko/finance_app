import DatabaseConnection from 'src/repositories/DatabaseConnection';
import UserDataAccess from 'src/services/user/UserDataAccess';
import config from 'src/config/dbConfig';
import UserService from './UserService';

export default class UserServiceBuilder {
    public static build() {
        const databaseConnection = new DatabaseConnection(config);
        return new UserService(new UserDataAccess(databaseConnection));
    }
}
