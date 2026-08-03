import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import ConnectionDataAccess from 'services/connection/ConnectionDataAccess';
import ConnectionService from 'services/connection/ConnectionService';
import GroupServiceBuilder from 'services/group/GroupServiceBuilder';
import { GroupOrchestrationService } from 'services/groupOrchestrator/GroupOrchestrationService';
import GroupSharedItemServiceBuilder from 'services/groupSharedItem/GroupSharedItemServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class GroupOrchestrationServiceBuilder {
    public static build(db: IDatabaseConnection = DatabaseConnectionBuilder.build()): GroupOrchestrationService {
        return new GroupOrchestrationService({
            groupService: GroupServiceBuilder.build(db),
            groupSharedItemService: GroupSharedItemServiceBuilder.build(db),
            connectionService: new ConnectionService(new ConnectionDataAccess(db)),
        });
    }
}
