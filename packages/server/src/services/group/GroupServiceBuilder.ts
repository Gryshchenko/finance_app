import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import GroupDataAccess from 'services/group/GroupDataAccess';
import GroupService from 'services/group/GroupService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class GroupServiceBuilder {
    public static build(db?: IDatabaseConnection) {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new GroupService(new GroupDataAccess(databaseConnection));
    }
}
