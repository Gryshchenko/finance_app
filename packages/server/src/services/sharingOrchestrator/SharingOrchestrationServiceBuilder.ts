import ConnectionDataAccess from 'services/connection/ConnectionDataAccess';
import ConnectionMemberServiceBuilder from 'services/connection/ConnectionMemberServiceBuilder';
import ConnectionOwnerServiceBuilder from 'services/connection/ConnectionOwnerServiceBuilder';
import ConnectionService from 'services/connection/ConnectionService';
import { GroupOrchestrationServiceBuilder } from 'services/groupOrchestrator/GroupOrchestrationServiceBuilder';
import { SharingOrchestrationService } from 'services/sharingOrchestrator/SharingOrchestrationService';
import UserServiceBuilder from 'services/user/UserServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class SharingOrchestrationServiceBuilder {
    public static build(): SharingOrchestrationService {
        const databaseConnection = DatabaseConnectionBuilder.build();
        return new SharingOrchestrationService({
            connectionOwnerService: ConnectionOwnerServiceBuilder.build(databaseConnection),
            connectionMemberService: ConnectionMemberServiceBuilder.build(databaseConnection),
            groupService: GroupOrchestrationServiceBuilder.build(databaseConnection),
            userService: UserServiceBuilder.build(),
            connectionService: new ConnectionService(new ConnectionDataAccess(databaseConnection)),
        });
    }
}
