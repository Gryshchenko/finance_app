import GroupDataAccess from 'services/group/GroupDataAccess';
import GroupService from 'services/group/GroupService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class GroupServiceBuilder {
    public static build() {
        return new GroupService(new GroupDataAccess(DatabaseConnectionBuilder.build()));
    }
}
