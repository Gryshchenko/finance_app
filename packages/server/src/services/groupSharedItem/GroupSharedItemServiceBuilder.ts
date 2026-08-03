import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import GroupSharedItemDataAccess from 'services/groupSharedItem/GroupSharedItemDataAccess';
import GroupSharedItemService from 'services/groupSharedItem/GroupSharedItemService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class GroupSharedItemServiceBuilder {
    public static build(db?: IDatabaseConnection) {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new GroupSharedItemService(new GroupSharedItemDataAccess(databaseConnection));
    }
}
