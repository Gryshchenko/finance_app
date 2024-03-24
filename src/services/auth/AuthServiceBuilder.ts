const AuthService = require('./AuthService');

module.exports = class AuthServiceBuilder {
    public static build() {
        const databaseConnection = new DatabaseConnection(dbConfig);
        return new AuthService({
            userService: new UserService(new UserDataAccess(databaseConnection)),
        });
    }
};
