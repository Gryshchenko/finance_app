import UserRoleService from 'services/userRole/UserRoleService';
import UserRoleDataAccess from 'services/userRole/UserRoleDataAccess';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class UserRoleServiceBuilder {
    public static build() {
        return new UserRoleService(new UserRoleDataAccess(DatabaseConnectionBuilder.build()));
    }
}
