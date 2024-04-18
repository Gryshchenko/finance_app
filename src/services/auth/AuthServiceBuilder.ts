import AuthService from './AuthService';
const DatabaseConnectionAuth = require('../../repositories/DatabaseConnection');
const dbConfigAuth = require('../../config/dbConfig');

export default class AuthServiceBuilder {
    public static build() {
        const databaseConnection = new DatabaseConnectionAuth(dbConfigAuth);
        return new AuthService({
            userService: new UserService(new UserDataAccess(databaseConnection)),
        });
    }
}
