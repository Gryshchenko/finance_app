import UserDataAccess from 'src/services/user/UserDataAccess';
import UserService from './UserService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class UserServiceBuilder {
    public static build() {
        return new UserService(new UserDataAccess(DatabaseConnectionBuilder.build()));
    }
}
